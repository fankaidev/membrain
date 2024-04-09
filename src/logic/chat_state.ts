import { create } from "zustand";
import { ChatTask } from "../utils/message";

export type ChatState = {
  chatStatus: string;
  chatTask: ChatTask | null;
  setChatStatus: (val: string) => void;
  setChatTask: (val: ChatTask | null) => void;
};

export const useChatState = create<ChatState>((set, get) => ({
  chatStatus: "",
  chatTask: null,
  setChatStatus: (val: string) => {
    set({ chatStatus: val });
  },
  setChatTask: (val: ChatTask | null) => {
    set({ chatTask: val });
  },
}));
