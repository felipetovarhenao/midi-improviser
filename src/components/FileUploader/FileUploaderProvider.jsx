import { createContext, useState } from "react";

export const FileUploaderContext = createContext();

export default function FileUploaderProvider({ children }) {
  const [files, setFiles] = useState({});
  return <FileUploaderContext.Provider value={{ files, setFiles }}>{children}</FileUploaderContext.Provider>;
}
