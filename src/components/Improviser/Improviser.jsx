import "./Improviser.scss";

import { useContext, useEffect, useState } from "react";
import { ImproviserContext } from "./ImproviserProvider";
import { FileUploaderContext } from "../FileUploader/FileUploaderProvider";

import classNames from "classnames";
import Slider from "../Slider/Slider";

export default function Improviser() {
  const { improviser } = useContext(ImproviserContext);
  const { files } = useContext(FileUploaderContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [downloadURL, setDownloadURL] = useState(false);
  const [isTrained, setIsTrained] = useState(false);

  /* UI control parameters */
  const [numNotes, setNumNotes] = useState(500);
  const [tempo, setTempo] = useState(90);
  const [markovOrder, setMarkovOrder] = useState(2);
  const [status, setStatus] = useState(false);
  const [keySignature, setKeySignature] = useState("C");
  const [keyMode, setKeyMode] = useState("major");
  const [reinforcementFactor, setReinforcementFactor] = useState(90);

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
    const bufferArray = await improviser.generate(Number(numNotes), Number(tempo), keySignature, keyMode, Number(reinforcementFactor) / 100);
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
            <label htmlFor="memory">Memory</label>
            <Slider
              name={"memory"}
              value={markovOrder}
              inMin={1}
              inMax={9}
              outMin={1}
              outMax={9}
              setValue={(value) => {
                setMarkovOrder(value);
                setIsTrained(false);
              }}
            />
          </div>
          <div className="buttons">
            <button onClick={train} disabled={!selectedFiles.length}>
              Train
            </button>
          </div>
          <div className="generate-form">
            <label htmlFor="num-notes">Max. number of notes</label>
            <Slider name={"num-notes"} value={numNotes} inMin={10} inMax={5000} outMin={10} outMax={5000} setValue={setNumNotes} />
            <label htmlFor="tempo">Initial tempo</label>
            <Slider name={"tempo"} value={tempo} inMin={10} inMax={640} outMin={10} outMax={640} setValue={setTempo} />
            <label htmlFor="reinforcement-slider">Choice reinforcement</label>
            <Slider name={"reinforcement-slider"} value={reinforcementFactor} setValue={setReinforcementFactor} />
            <label htmlFor="keySignature">Key signature</label>
            <div className="key-control">
              <select name="key" id="keySignature" onChange={(e) => setKeySignature(e.target.value)} defaultValue={keySignature}>
                {improviser &&
                  Object.keys(improviser.PITCHNAMES).map((keySig, i) => (
                    <option key={i} value={keySig}>
                      {keySig}
                    </option>
                  ))}
              </select>
              <select name="mode" id="keyMode" onChange={(e) => setKeyMode(e.target.value)} defaultValue={keyMode}>
                {["major", "minor"].map((mode, i) => (
                  <option key={i} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="buttons">
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
          </div>
        </form>
        {status && <div className="status">{status}</div>}
      </div>
    </div>
  );
}
