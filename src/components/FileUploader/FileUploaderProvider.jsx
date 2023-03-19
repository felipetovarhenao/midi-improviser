import { createContext, useState } from "react";

export const FileUploaderContext = createContext();

export default function FileUploaderProvider({ children }) {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  return <FileUploaderContext.Provider value={{ files, setFiles, selectedFiles, setSelectedFiles }}>{children}</FileUploaderContext.Provider>;
}
