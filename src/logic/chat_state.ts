import { create } from "zustand";
import { ChatTask, PromptTemplate } from "../utils/message";
import { getFromStorage, saveToStorage } from "./chrome_storage";

export type ChatState = {
  chatStatus: string;
  chatTask: ChatTask | null;
  setChatStatus: (val: string) => void;
  setChatTask: (val: ChatTask | null) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  promptTemplates: PromptTemplate[];
  setPromptTemplates: (val: PromptTemplate[]) => void;
  loadChatState: () => Promise<void>;
};

export const useChatState = create<ChatState>((set, get) => ({
  chatStatus: "",
  chatTask: null,
  temperature: 0.3,
  promptTemplates: [],
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
  setPromptTemplates: (val: PromptTemplate[]) => {
    set({ promptTemplates: val });
    saveToStorage("sync", "promptTemplates", val);
  },
  loadChatState: async () => {
    const temperature = await getFromStorage("sync", "temperature", 0.3);
    const promptTemplates = await getFromStorage("sync", "promptTemplates", []);
    set({ temperature, promptTemplates });
  },
}));
