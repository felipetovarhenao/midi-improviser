import { useContext, useEffect, useState } from "react";
import { ImproviserContext } from "./ImproviserProvider";
import { FileUploaderContext } from "../FileUploader/FileUploaderProvider";
import "./Improviser.scss";

export default function Improviser() {
  const { improviser } = useContext(ImproviserContext);
  const { selectedFiles } = useContext(FileUploaderContext);
  const [downloadURL, setDownloadURL] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [numNotes, setNumNotes] = useState(500);
  const [tempo, setTempo] = useState(90);
  const [markovOrder, setMarkovOrder] = useState(2);
  const [status, setStatus] = useState(false);
  const [keySignature, setKeySignature] = useState("C");
  const [keyMode, setKeyMode] = useState("major");

  async function train() {
    if (improviser.getMemory() !== markovOrder) {
      improviser.setMemory(markovOrder);
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
    const bufferArray = await improviser.generate(numNotes, tempo, keySignature, keyMode);
    const blob = new Blob([bufferArray], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    setTimeout(() => {
      setDownloadURL(url);
      setStatus("done generating!");
    }, 250);
  }

  function makeFileName() {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();

    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;

    const formattedToday = dd + "-" + mm + "-" + yyyy;

    return `MIDI improviser output (${numNotes} notes in ${keySignature}${keyMode === "major" ? "M" : "m"} @ ${tempo}BPM on ${formattedToday}).mid`;
  }

  return (
    <div className="Improviser">
      <h2>SETTINGS</h2>
      <p className="description">Set the configuration for MIDI generation</p>
      <div className="form-container">
        <form onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="tempo">Memory</label>
          <input
            type="number"
            id="memory"
            value={markovOrder}
            onChange={(e) => {
              const value = e.target.value;
              value > 0 && value < 10 && (setMarkovOrder(e.target.value) || setIsTrained(false));
            }}
          />
          <div className="buttons">
            <button onClick={train} disabled={!selectedFiles.length}>
              Train
            </button>
          </div>
          <label htmlFor="num-notes">Max. number of notes</label>
          <input
            type="number"
            id="num-notes"
            value={numNotes}
            onChange={(e) => {
              const value = e.target.value;
              value > 0 && value < 100000 && setNumNotes(e.target.value);
            }}
          />
          <label htmlFor="tempo">Initial tempo</label>
          <input
            type="number"
            id="tempo"
            value={tempo}
            onChange={(e) => {
              const value = e.target.value;
              value > 10 && value < 640 && setTempo(e.target.value);
            }}
          />
          <label htmlFor="keySignature">Key signature</label>
          <select name="key" id="keySignature" onChange={(e) => setKeySignature(e.target.value)} defaultValue={keySignature}>
            {improviser &&
              Object.keys(improviser.PITCHNAMES).map((keySig, i) => (
                <option key={i} value={keySig}>
                  {keySig}
                </option>
              ))}
          </select>
          <label htmlFor="keyMode">Mode</label>
          <select name="mode" id="keyMode" onChange={(e) => setKeyMode(e.target.value)} defaultValue={keyMode}>
            {["major", "minor"].map((mode, i) => (
              <option key={i} value={mode}>
                {mode}
              </option>
            ))}
          </select>
          <div className="buttons">
            <button onClick={generate} disabled={!isTrained}>
              Generate
            </button>
            <button disabled={!downloadURL}>
              {downloadURL ? (
                <a href={downloadURL} download={makeFileName()} onClick={() => setDownloadURL(false) || setStatus(false)}>
                  Download
                </a>
              ) : (
                "Download"
              )}
            </button>
          </div>
        </form>
        {status && <div className="status">{status}</div>}
      </div>
    </div>
  );
}
