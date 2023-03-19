import { createContext, useState } from "react";
import Improviser from "../../utils/improviser";

export const ImproviserContext = createContext();

export default function ImproviserProvider({ children }) {
  const [improviser, setImproviser] = useState(new Improviser());
  return <ImproviserContext.Provider value={{ improviser, setImproviser }}>{children}</ImproviserContext.Provider>;
}
