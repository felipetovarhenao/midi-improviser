import FileUploaderProvider from "./components/FileUploader/FileUploaderProvider";
import FileUploader from "./components/FileUploader/FileUploader";
import "./App.scss";
import ImproviserProvider from "./components/Improviser/ImproviserProvider";
import Improviser from "./components/Improviser/Improviser";
import AppHeader from "./components/AppHeader/AppHeader";
import { Icon } from "@iconify/react";

export default function App() {
  return (
    <div className="App">
      <ImproviserProvider>
        <FileUploaderProvider>
          <AppHeader />
          <div className="modules">
            <FileUploader />
            <Improviser />
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
