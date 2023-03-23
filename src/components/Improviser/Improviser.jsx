import "./Improviser.scss";

import { useContext, useEffect, useState } from "react";
import { ImproviserContext } from "./ImproviserProvider";
import { FileUploaderContext } from "../FileUploader/FileUploaderProvider";

import classNames from "classnames";
import Slider from "../Slider/Slider";

import HelpBox from "../HelpBox/HelpBox";
import ButtonPanel from "../ButtonPanel/ButtonPanel";

import { Midi } from "@tonejs/midi";

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

/* cache for all midi files loaded in current session */
const FILE_CACHE = {};

function filesToMidi(files) {
  return files.map(async (file) => {
    if (FILE_CACHE[file.name]) {
      return FILE_CACHE[file.name];
    } else {
      const url = URL.createObjectURL(file);
      const midi = await Midi.fromUrl(url);
      FILE_CACHE[file.name] = midi;
      return midi;
    }
  });
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
  const [markovOrder, setMarkovOrder] = useState(getStorageValue("markovOrder") || 5);
  const [creativity, setCreativity] = useState(getStorageValue("creativity") || 3);
  const [keySignature, setKeySignature] = useState(getStorageValue("keySignature") || "C");
  const [keyMode, setKeyMode] = useState(getStorageValue("keyMode") || "major");
  const [reinforcementFactor, setReinforcementFactor] = useState(getStorageValue("reinforcementFactor") || 90);
  const [enforceKey, setEnforceKey] = useState(getStorageValue("enforceKey") === true);

  async function train() {
    /* convert String to Number */
    setIsTrained(false);
    setStatus(`training improviser...`);
    const midiFiles = filesToMidi(selectedFiles);

    const predictability = 4 - Number(creativity);
    if (improviser.getPredictability() !== predictability) {
      improviser.setPredictability(predictability);
    }

    await improviser.trainBase(midiFiles);

    setStatus("done training!");
    setIsTrained(true);
    setDownloadURL(false);
  }

  async function generate() {
    setDownloadURL(false);
    setStatus("generating MIDI...");

    const memory = Number(markovOrder);
    if (improviser.getMemory() !== memory) {
      improviser.setMemory(memory, false);
    }
    const bufferArray = await improviser.generateRecursively(
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
    const mem = improviser.getMemory();
    return `improv (${numNotes} notes in ${keySignature}${keyMode === "major" ? "M" : "m"} @ ${tempo}BPM with memory size of ${mem}).mid`;
  }

  useEffect(() => {
    const sel = [];
    Object.keys(files).forEach((name) => files[name].selected && sel.push(files[name].file));
    setSelectedFiles(sel);
  }, [files]);

  return (
    <div className="Improviser">
      <h2>SETTINGS</h2>
      <p className="description">Set the training and improvisation settings.</p>
      <div className="form-container">
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <div className="train-form">
            <label htmlFor="creativity">
              Creativity <HelpBox>How much the improviser is able to deviate from the original music.</HelpBox>
            </label>
            <Slider
              name={"creativity"}
              value={creativity}
              inMin={1}
              inMax={3}
              outMin={1}
              outMax={3}
              setValue={(value) => {
                setStorageValue(setCreativity, "creativity")(value);
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
            <div className="form-subsection">Behavior</div>
            <div></div>
            <label htmlFor="memory">
              Memory{" "}
              <HelpBox>
                Amount of contextual information the improviser considers to generate music. A higher memory value will increase the consistency and
                predictability of the improvisation.
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
              }}
            />
            <label htmlFor="reinforcement-slider">
              Choice reinforcement
              <HelpBox>
                <p>
                  Degree to which the improviser can update its musical knowledge during the improvisation, encouraging the repetition of previously
                  made choices.
                </p>
              </HelpBox>
            </label>
            <Slider
              name={"reinforcement-slider"}
              value={reinforcementFactor}
              setValue={setStorageValue(setReinforcementFactor, "reinforcementFactor")}
            />
            <div className="form-subsection">Output</div>
            <div></div>
            <label htmlFor="num-notes">
              Number of notes
              <HelpBox>Number of notes to be generated.</HelpBox>
            </label>
            <Slider
              name={"num-notes"}
              value={numNotes}
              inMin={50}
              inMax={3000}
              outMin={50}
              outMax={3000}
              step={50}
              setValue={setStorageValue(setNumNotes, "numNotes")}
            />
            <label htmlFor="tempo">
              Tempo
              <HelpBox>Desired tempo in beats per minute (BPM).</HelpBox>
            </label>
            <Slider name={"tempo"} value={tempo} inMin={40} inMax={208} outMin={40} outMax={208} setValue={setStorageValue(setTempo, "tempo")} />
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
                  defaultChecked={enforceKey}
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
