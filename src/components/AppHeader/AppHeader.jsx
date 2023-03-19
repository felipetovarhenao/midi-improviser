import "./AppHeader.scss";
import { Icon } from "@iconify/react";

export default function AppHeader() {
  return (
    <div className="AppHeader">
      <h1 className="header">
        <Icon className="icon" icon="simple-icons:midi" />
        improviser
      </h1>
      <div>
        <p>
          <b>MIDI improviser</b> generates a MIDI file, based on one or more MIDI input files provided by the user. To start, follow these steps:
        </p>
        <ol>
          <li>
            <b>Upload</b> one or more MIDI files, and select the ones you want to use.
          </li>
          <li>
            <b>Train</b> the improviser, based on the selected files.
          </li>
          <li>
            <b>Configure</b> generation settings, such as tempo and max. number of notes.
          </li>
          <li>
            <b>Generate</b> MIDI.
          </li>
          <li>
            <b>Download</b> generated MIDI!
          </li>
        </ol>
      </div>
    </div>
  );
}
