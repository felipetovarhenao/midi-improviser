import "./Improviser.scss";

import { useContext, useEffect, useState } from "react";
import { ImproviserContext } from "./ImproviserProvider";
import { FileUploaderContext } from "../FileUploader/FileUploaderProvider";

import classNames from "classnames";
import Slider from "../Slider/Slider";

import HelpBox from "../HelpBox/HelpBox";
import ButtonPanel from "../ButtonPanel/ButtonPanel";

function setStorageValue(setValue, key) {
  return (value) => {
    setValue(value);
    localStorage.setItem(key, JSON.stringify(value));
  };
}

function getStorageValue(key) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : undefined;
}

export default function Improviser() {
  const { improviser } = useContext(ImproviserContext);
  const { files } = useContext(FileUploaderContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [downloadURL, setDownloadURL] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [status, setStatus] = useState(false);

  /* UI control parameters */
  const [numNotes, setNumNotes] = useState(getStorageValue("numNotes") || 500);
  const [tempo, setTempo] = useState(getStorageValue("tempo") || 90);
  const [markovOrder, setMarkovOrder] = useState(getStorageValue("markovOrder") || 2);
  const [keySignature, setKeySignature] = useState(getStorageValue("keySignature") || "C");
  const [keyMode, setKeyMode] = useState(getStorageValue("keyMode") || "major");
  const [reinforcementFactor, setReinforcementFactor] = useState(getStorageValue("reinforcementFactor") || 90);
  const [enforceKey, setEnforceKey] = useState(getStorageValue("enforceKey") || false);

  async function train() {
    /* convert String to Number */
    const memory = Number(markovOrder);
    if (improviser.getMemory() !== memory) {
      improviser.setMemory(memory);
    }
    setIsTrained(false);
    setStatus(`training improviser (memory size: ${markovOrder})...`);
    await improviser.train(selectedFiles);
    setStatus("done training!");
    setIsTrained(true);
    setDownloadURL(false);
  }

  async function generate() {
    setDownloadURL(false);
    setStatus("generating MIDI...");
    const bufferArray = await improviser.generate(
      Number(numNotes),
      Number(tempo),
      keySignature,
      keyMode,
      Number(reinforcementFactor) / 100,
      Boolean(enforceKey)
    );
    const blob = new Blob([bufferArray], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    setDownloadURL(url);
    setStatus("done generating!");
  }

  function makeFileName() {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();

    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;

    const date = dd + "-" + mm + "-" + yyyy;
    const mem = improviser.markov.order;

    return `improv (${numNotes} notes in ${keySignature}${keyMode === "major" ? "M" : "m"} @ ${tempo}BPM with memory size of ${mem} on ${date}).mid`;
  }

  useEffect(() => {
    const sel = [];
    Object.keys(files).forEach((name) => files[name].selected && sel.push(files[name].file));
    setSelectedFiles(sel);
  }, [files]);

  return (
    <div className="Improviser">
      <h2>SETTINGS</h2>
      <p className="description">Set the configuration for MIDI generation</p>
      <div className="form-container">
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <div className="train-form">
            <label htmlFor="memory">
              Memory{" "}
              <HelpBox>
                <i>Memory</i> controls the amount of contextual information the improviser learns from the MIDI files. A higher memory value results
                in music that more closely resembles the selected MIDI files.
              </HelpBox>
            </label>
            <Slider
              name={"memory"}
              value={markovOrder}
              inMin={1}
              inMax={9}
              outMin={1}
              outMax={9}
              setValue={(value) => {
                setStorageValue(setMarkovOrder, "markovOrder")(value);
                setIsTrained(false);
              }}
            />
          </div>
          <ButtonPanel>
            <button onClick={train} disabled={!selectedFiles.length}>
              Train
            </button>
          </ButtonPanel>
          <div className="generate-form">
            <label htmlFor="num-notes">
              Max. number of notes
              <HelpBox>Maximum number of notes to be generated.</HelpBox>
            </label>
            <Slider
              name={"num-notes"}
              value={numNotes}
              inMin={10}
              inMax={5000}
              outMin={10}
              outMax={5000}
              setValue={setStorageValue(setNumNotes, "numNotes")}
            />
            <label htmlFor="tempo">
              Tempo
              <HelpBox>Desired tempo in beats per minute (BPM)</HelpBox>
            </label>
            <Slider name={"tempo"} value={tempo} inMin={10} inMax={640} outMin={10} outMax={640} setValue={setStorageValue(setTempo, "tempo")} />
            <label htmlFor="reinforcement-slider">
              Choice reinforcement
              <HelpBox>
                <p>
                  Degree to which the improviser can update its musical knowledge during the improvisation, encouraging the repetition of previously
                  made choices.
                </p>
                <br />
                <p>A higher value increases the chances of generating more cohesive/predictable music.</p>
              </HelpBox>
            </label>
            <Slider
              name={"reinforcement-slider"}
              value={reinforcementFactor}
              setValue={setStorageValue(setReinforcementFactor, "reinforcementFactor")}
            />
            <label htmlFor="keySignature">
              Key signature
              <HelpBox>
                Desired key signature. If enforced, the improviser will <b>only</b> use pitches from the specified key.
              </HelpBox>
            </label>
            <div className="key-control">
              <select
                name="key"
                id="keySignature"
                onChange={(e) => setStorageValue(setKeySignature, "keySignature")(e.target.value)}
                defaultValue={keySignature}
              >
                {improviser &&
                  Object.keys(improviser.PITCHNAMES).map((keySig, i) => (
                    <option key={i} value={keySig}>
                      {keySig}
                    </option>
                  ))}
              </select>
              <select name="mode" id="keyMode" onChange={(e) => setStorageValue(setKeyMode, "keyMode")(e.target.value)} defaultValue={keyMode}>
                {["major", "minor"].map((mode, i) => (
                  <option key={i} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
              <div className="enforce-key-container">
                <label htmlFor="enforce-key">Enforce</label>
                <input
                  name="enforce-key"
                  type="checkbox"
                  value={enforceKey}
                  onChange={(e) => setStorageValue(setEnforceKey, "enforceKey")(e.target.checked)}
                />
              </div>
            </div>
          </div>

          <ButtonPanel>
            <button onClick={generate} disabled={!isTrained}>
              Generate
            </button>
            <button
              className={classNames({ disabled: !downloadURL })}
              onClick={() => {
                const link = document.createElement("a");
                link.href = downloadURL;
                link.download = makeFileName();
                link.click();
                setStatus("downloading...");
                setTimeout(() => {
                  URL.revokeObjectURL(downloadURL);
                  setStatus(false);
                }, 2000);
                setDownloadURL(false);
              }}
            >
              Download
            </button>
          </ButtonPanel>
        </form>
        {status && <div className="status">{status}</div>}
      </div>
    </div>
  );
}
