import FileUploaderProvider from "./components/FileUploader/FileUploaderProvider";
import FileUploader from "./components/FileUploader/FileUploader";
import "./App.scss";
import ImproviserProvider from "./components/Improviser/ImproviserProvider";
import Improviser from "./components/Improviser/Improviser";
import AppHeader from "./components/AppHeader/AppHeader";

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
            <a href="https://felipe-tovar-henao.com/">https://felipe-tovar-henao.com/</a>
          </footer>
        </FileUploaderProvider>
      </ImproviserProvider>
    </div>
  );
}
