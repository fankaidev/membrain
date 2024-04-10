import { create } from "zustand";
import { getLocaleMessage } from "../utils/locale";
import { getFromStorage, saveToStorage } from "./chrome_storage";

export type AppState = {
  UILanguage: string;
  chatLanguage: string;
  setUILanguage: (val: string) => void;
  setChatLanguage: (val: string) => void;
  loadAppState: () => Promise<void>;
  displayText: (text: string) => string;
};

export const useAppState = create<AppState>((set, get) => ({
  UILanguage: "en",
  chatLanguage: "English",
  setUILanguage: (val: string) => {
    set({ UILanguage: val });
    saveToStorage("sync", "UILanguage", val);
  },
  setChatLanguage: (val: string) => {
    set({ chatLanguage: val });
    saveToStorage("sync", "chatLanguage", val);
  },
  loadAppState: async () => {
    const UILanguage = await getFromStorage("sync", "UILanguage", "en");
    const chatLanguage = await getFromStorage("sync", "chatLanguage", "English");
    set({ UILanguage, chatLanguage });
  },
  displayText: (text: string) => {
    return getLocaleMessage(get().UILanguage, text);
  },
}));
