import "./AppHeader.scss";
import { Icon } from "@iconify/react";
import logo from "../../assets/logo.png";

export default function AppHeader() {
  return (
    <div className="AppHeader">
      <div className="header">
        <img src={logo} alt="logo" className="logo" />
        <h1 className="title">
          <Icon className="icon" icon="simple-icons:midi" />
          improviser
        </h1>
      </div>
      <div>
        <p>
          <b>MIDI improviser</b> is a web application that generates a polyphonic music improvisation as a MIDI file, based on one or more MIDI files
          provided by the user.
        </p>
        <br />
        <p>To start, follow these steps:</p>
        <ol className="step-list">
          <li>
            <b>Upload</b> one or more MIDI files, and select the ones you want to use.
          </li>
          <li>
            <b>Train</b> the improviser.
          </li>
          <li>
            <b>Configure</b> the training and generation settings, such as tempo, number of notes, and key signature. To learn more about each
            setting, hover over the icon next to their name and read the description box.
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
