import { create } from "zustand";
import { ChatTask } from "../utils/message";
import { getFromStorage, saveToStorage } from "./chrome_storage";

export type ChatState = {
  chatStatus: string;
  chatTask: ChatTask | null;
  setChatStatus: (val: string) => void;
  setChatTask: (val: ChatTask | null) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  loadChatState: () => Promise<void>;
};

export const useChatState = create<ChatState>((set, get) => ({
  chatStatus: "",
  chatTask: null,
  temperature: 0.3,
  setChatStatus: (val: string) => {
    set({ chatStatus: val });
  },
  setChatTask: (val: ChatTask | null) => {
    set({ chatTask: val });
  },
  setTemperature: (val: number) => {
    set({ temperature: val });
    saveToStorage("sync", "temperature", val);
  },
  loadChatState: async () => {
    const temperature = await getFromStorage("sync", "temperature", 0.3);
    set({ temperature });
  },
}));
