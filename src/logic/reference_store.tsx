import { Reference } from "../utils/message";
import { getCurrentPageRef, getCurrentSelectionRef } from "../utils/page_content";

import { create } from "zustand";

export type ChatReferenceStore = {
  references: Reference[];
  addPageRef: () => Promise<Reference | null>;
  addSelectionRef: () => Promise<Reference | null>;
  removeReference: (id: string) => void;
  clearReferences: () => void;
};

export const useChatReferenceStore = create<ChatReferenceStore>((set) => ({
  references: [],

  addPageRef: async () => {
    const pageRef = await getCurrentPageRef();
    if (!pageRef) {
      return null;
    }

    set((state) => {
      if (!state.references.find((r) => r.type === "webpage" && r.url === pageRef.url)) {
        return { references: [...state.references, pageRef] };
      } else {
        console.debug("skip adding existing reference");
        return state;
      }
    });
    return pageRef;
  },

  addSelectionRef: async () => {
    const selectionRef = await getCurrentSelectionRef();
    if (selectionRef) {
      set((state) => ({
        references: [...state.references, selectionRef],
      }));
      return selectionRef;
    } else {
      return null;
    }
  },

  removeReference: (id: string) => {
    set((state) => ({
      references: state.references.filter((r) => r.id !== id),
    }));
  },

  clearReferences: () => {
    set({ references: [] });
  },
}));
