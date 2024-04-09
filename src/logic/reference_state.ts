import { create } from "zustand";
import { Reference } from "../utils/message";
import { getCurrentPageRef, getCurrentSelectionRef } from "../utils/page_content";
import { getFromStorage, saveToStorage } from "./useStorage";

export type ChatReferenceStore = {
  references: Reference[];
  addPageRef: () => Promise<Reference | null>;
  addSelectionRef: () => Promise<Reference | null>;
  removeRef: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  load: () => Promise<void>;
};

export const useReferenceStore = create<ChatReferenceStore>((set, get) => ({
  references: [],

  addPageRef: async () => {
    const pageRef = await getCurrentPageRef();
    if (!pageRef) {
      return null;
    }

    const state = get();
    if (!state.references.find((r) => r.type === "webpage" && r.url === pageRef.url)) {
      const result = [...state.references, pageRef];
      set({ references: result });
      await saveToStorage("local", "references", result);
    } else {
      console.debug("skip adding existing reference");
    }

    return pageRef;
  },

  addSelectionRef: async () => {
    const selectionRef = await getCurrentSelectionRef();
    if (!selectionRef) {
      return null;
    }

    console.log("sss", selectionRef);
    const state = get();
    const result = [...state.references, selectionRef];
    set({ references: result });
    await saveToStorage("local", "references", result);

    return selectionRef;
  },

  removeRef: async (id: string) => {
    const result = get().references.filter((r) => r.id !== id);
    set({ references: result });
    await saveToStorage("local", "references", result);
  },

  clear: async () => {
    set({ references: [] });
    await saveToStorage("local", "references", []);
  },

  load: async () => {
    const references = await getFromStorage("local", "references", []);
    set({ references });
  },
}));
