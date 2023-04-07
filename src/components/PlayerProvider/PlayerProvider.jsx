import { createContext, useState } from "react";
import Player from "../../utils/player";

export const PlayerContext = createContext();

export default function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(new Player());
  return <PlayerContext.Provider value={{ player, setPlayer }}>{children}</PlayerContext.Provider>;
}
