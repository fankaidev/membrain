import { createContext } from "react";
import { ChatTask } from "../utils/message";

export const ChatContext = createContext<{
  chatStatus: string;
  setChatStatus: (val: string) => void;
  chatTask: ChatTask | null;
  setChatTask: (val: ChatTask | null) => void;
} | null>(null);
