import FileUploaderProvider from "./components/FileUploader/FileUploaderProvider";
import FileUploader from "./components/FileUploader/FileUploader";
import "./App.scss";
import ImproviserProvider from "./components/Improviser/ImproviserProvider";
import Improviser from "./components/Improviser/Improviser";
import AppHeader from "./components/AppHeader/AppHeader";
import { Icon } from "@iconify/react";
import Player from "./utils/player";

export default function App() {
  const player = new Player();
  return (
    <div className="App">
      <ImproviserProvider>
        <FileUploaderProvider>
          <AppHeader />
          <div className="modules">
            <FileUploader />
            <Improviser />
            <button onClick={() => player.init()}>Start</button>
            <button onClick={() => player.playNote(60)}>Play</button>
          </div>
          <footer className="footer">
            <a target="_blank" rel="noreferrer" href="https://felipe-tovar-henao.com/">
              https://felipe-tovar-henao.com/
            </a>
            &nbsp;|&nbsp;
            <a target="_blank" rel="noreferrer" href="https://github.com/felipetovarhenao/midi-improviser">
              <Icon className="gh-icon" icon="mdi:github" /> view on github
            </a>
          </footer>
        </FileUploaderProvider>
      </ImproviserProvider>
    </div>
  );
}
