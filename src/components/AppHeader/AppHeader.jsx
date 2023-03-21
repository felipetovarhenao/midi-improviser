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
          <b>MIDI improviser</b> is a web application that generates a polyphonic music improvisation as a MIDI file, based on one or more MIDI input
          files provided by the user. The degree of freedom or <i>creativity</i> of the improviser is determined by the <i>memory</i> value (see{" "}
          <b>SETTINGS</b>). The lower the memory value, the less similar the resulting music is to the original MIDI, while a higher memory value will
          generate music that closely resembles the selected MIDI file(s).
        </p>
        <br />
        <p>To start, follow these steps:</p>
        <ol>
          <li>
            <b>Upload</b> one or more MIDI files, and select the ones you want to use.
          </li>
          <li>
            <b>Train</b> the improviser, based on the selected files and memory value.
          </li>
          <li>
            <b>Configure</b> generation settings, such as tempo, max. number of notes, and initial key.
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
