import { create } from "zustand";
import { Reference } from "../utils/message";
import { getCurrentPageRef, getCurrentSelectionRef } from "../utils/page_content";
import { getFromStorage, saveToStorage } from "./useStorage";

export type ChatReferenceStore = {
  references: Reference[];
  addPageRef: () => Promise<Reference | null>;
  addSelectionRef: () => Promise<Reference | null>;
  removeRef: (id: string) => void;
  clear: () => void;
  load: () => Promise<void>;
};

export const useReferenceStore = create<ChatReferenceStore>((set) => ({
  references: [],

  addPageRef: async () => {
    const pageRef = await getCurrentPageRef();
    if (!pageRef) {
      return null;
    }

    set((state) => {
      if (!state.references.find((r) => r.type === "webpage" && r.url === pageRef.url)) {
        const result = [...state.references, pageRef];
        saveToStorage("local", "references", result);
        return { references: result };
      } else {
        console.debug("skip adding existing reference");
        return state;
      }
    });
    return pageRef;
  },

  addSelectionRef: async () => {
    const selectionRef = await getCurrentSelectionRef();
    if (!selectionRef) {
      return null;
    }

    set((state) => {
      const result = [...state.references, selectionRef];
      saveToStorage("local", "references", result);
      return { references: result };
    });
    return selectionRef;
  },

  removeRef: (id: string) => {
    set((state) => {
      const result = state.references.filter((r) => r.id !== id);
      saveToStorage("local", "references", result);
      return { references: result };
    });
  },

  clear: () => {
    set({ references: [] });
    saveToStorage("local", "references", []);
  },

  load: async () => {
    const references = await getFromStorage("local", "references", []);
    set({ references });
  },
}));
