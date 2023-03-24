import { useContext, useEffect, useState } from "react";
import { FileUploaderContext } from "./FileUploaderProvider";
import Toggle from "../Toggle/Toggle";
import "./FileUploader.scss";
import ButtonPanel from "../ButtonPanel/ButtonPanel";

export default function FileUploader() {
  const { files, setFiles } = useContext(FileUploaderContext);
  const [numSelected, setNumSelected] = useState(0);

  function appendFiles() {
    const inputElement = document.getElementById("midi");
    const midiFiles = Array.from(inputElement.files);
    inputElement.value = "";

    if (!midiFiles.length) {
      return;
    }

    const newFiles = {};
    midiFiles.forEach((file) => {
      /* skip non midi files */
      const fname = file.name.toLowerCase();
      if (!fname.endsWith(".mid") && !fname.endsWith(".midi")) {
        return;
      }
      /* add file if not already in menu */
      if (files[file.name] === undefined) {
        newFiles[file.name] = { file: file, selected: true };
      }
    });
    setFiles((prev) => ({ ...prev, ...newFiles }));
  }

  useEffect(() => {
    const selected = Object.keys(files).filter((name) => files[name].selected);
    setNumSelected(selected.length);
  }, [files]);

  function onToggleClick(fileName) {
    setFiles((prev) => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        selected: !prev[fileName].selected,
      },
    }));
  }

  function setAllToggles(state) {
    const newFiles = {};
    Object.keys(files).forEach((name) => (newFiles[name] = { ...files[name], selected: state }));
    setFiles(newFiles);
  }

  function deleteSelected() {
    const newFiles = {};
    Object.keys(files).forEach((name) => {
      if (!files[name].selected) {
        newFiles[name] = files[name];
      }
    });
    setFiles(newFiles);
  }

  return (
    <div className="FileUploader">
      <div>
        <h2>FILE BROWSER</h2>
        <p className="description">Upload MIDI files, and select the ones you want to use to train the improviser.</p>
        <div className="file-menu">
          {Object.keys(files)
            .sort()
            .map((fileName, i) => {
              return (
                <Toggle
                  key={i}
                  text={fileName}
                  isSelected={files[fileName].selected}
                  onClick={() => onToggleClick(fileName)}
                  className="fileToggle"
                />
              );
            })}
        </div>
        <ButtonPanel>
          <input type="file" id="midi" accept=".mid, .midi, audio/midi" onChange={appendFiles} multiple />
          <button onClick={() => setAllToggles(true)} disabled={Object.keys(files).length === 0}>
            Select all
          </button>
          <button onClick={() => setAllToggles(false)} disabled={!numSelected}>
            Clear selection
          </button>
          <label htmlFor="midi">Add files</label>
          <button className="danger" onClick={deleteSelected} disabled={!numSelected}>
            Remove files
          </button>
        </ButtonPanel>
        <div className="status">{numSelected > 0 && `${numSelected} file(s) selected`}</div>
      </div>
    </div>
  );
}
