import { useContext, useState } from "react";
import { FileUploaderContext } from "./FileUploaderProvider";
import classNames from "classnames";
import Toggle from "../Toggle/Toggle";
import "./FileUploader.scss";

function includesFile(files, file) {
  /* filter out existing files */
  for (let i = 0; i < files.length; i++) {
    if (files[i].name === file.name) {
      return true;
    }
  }
  return false;
}

export default function FileUploader() {
  const { files, setFiles, selectedFiles, setSelectedFiles } = useContext(FileUploaderContext);
  const [resetToggles, setResetToggles] = useState(false);

  function appendFiles() {
    const midiFiles = document.getElementById("midi").files;
    if (!midiFiles) {
      return;
    }

    /* only add files that haven't been uploaded */
    const newFiles = Array.from(midiFiles).filter((x) => !includesFile(files, x));
    setFiles((prev) => [...prev, ...newFiles].sort((a, b) => a.name - b.name));

    document.getElementById("midi").value = "";
  }

  function handleFileSelection(selected, file) {
    if (selected) {
      setSelectedFiles((prev) => [...prev, file]);
    } else {
      const update = [...selectedFiles];
      update.pop(file);
      setSelectedFiles(update);
    }
  }

  function deleteSelected() {
    const update = [...files];
    setFiles(update.filter((file) => !includesFile(selectedFiles, file)));
    setResetToggles((x) => !x);
    setSelectedFiles([]);
  }

  return (
    <div className="FileUploader">
      <div>
        <h2>File menu</h2>
        <p className="description">Upload MIDI files, and select the ones you want to use to train the improviser.</p>
        <div className="file-menu">
          {Array.from(files).map((file, i) => {
            return (
              <Toggle
                key={i}
                text={file.name}
                reset={resetToggles}
                onSelect={(selected) => handleFileSelection(selected, file)}
                className="fileToggle"
              />
            );
          })}
        </div>
        <div className="buttons">
          <label htmlFor="midi">Add files</label>
          <input type="file" id="midi" accept=".mid, .midi, audio/midi" onChange={appendFiles} multiple />
          <button className="danger" onClick={deleteSelected} disabled={!selectedFiles.length}>
            Remove files
          </button>
        </div>
      </div>
    </div>
  );
}
