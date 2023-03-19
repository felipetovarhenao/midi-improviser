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

  async function train() {
    if (improviser.getMemory() !== markovOrder) {
      improviser.setMemory(markovOrder);
    }
    setIsTrained(false);
    setStatus("training...");
    console.log(selectedFiles);
    await improviser.train(selectedFiles);
    setStatus("trained!");
    setIsTrained(true);
    setDownloadURL(false);
  }

  async function generate() {
    setDownloadURL(false);
    setStatus("generating MIDI...");
    const bufferArray = await improviser.generate(numNotes, tempo);
    const blob = new Blob([bufferArray], { type: "audio/midi" });
    setStatus("done!");
    setDownloadURL(URL.createObjectURL(blob));
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
              value > 0 && value < 10 && setMarkovOrder(e.target.value);
            }}
          />
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
          <div className="buttons">
            <button onClick={train} disabled={!selectedFiles.length}>
              Train
            </button>
            <button onClick={generate} disabled={!isTrained}>
              Generate
            </button>
            <button disabled={!downloadURL}>
              {downloadURL ? (
                <a href={downloadURL} download={`midi-${Date.now()}.mid`} onClick={() => setDownloadURL(false) || setStatus(false)}>
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
