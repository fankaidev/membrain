const storageMock = (() => {
  let storage: { [key: string]: string } = {};

  return {
    set: jest.fn((items, callback = () => {}) => {
      Object.keys(items).forEach((key) => {
        storage[key] = items[key];
      });
      callback();
    }),
    get: jest.fn((keys, callback = () => {}) => {
      console.log("get keys", keys);
      const items: { [key: string]: string } = {};
      if (typeof keys === "string") {
        items[keys] = storage[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach((key) => {
          items[key] = storage[key];
        });
      } else if (keys === null) {
        Object.assign(items, storage);
      } else {
        Object.keys(keys).forEach((key) => {
          items[key] = storage[key];
        });
      }
      callback(items);
    }),
    clear: jest.fn(() => {
      storage = {};
    }),
  };
})();

// 使用 globalThis 来模拟 chrome.storage.local
globalThis.chrome = {
  storage: {
    // @ts-ignore
    local: storageMock,
  },
};

import { act, renderHook } from "@testing-library/react";
import { useReferenceStore } from "../logic/reference_state";
import { Reference } from "../utils/message";

jest.mock("../utils/page_content", () => ({
  getCurrentPageRef: jest
    .fn()
    .mockImplementation(() => Promise.resolve(new Reference("webpage", "title", "url", "content"))),
  getCurrentSelectionRef: jest
    .fn()
    .mockResolvedValue(() => new Reference("text", "title", "url", "content")),
}));

describe("useReferenceStore", () => {
  beforeEach(() => {
    storageMock.clear();
  });

  it("should add a page reference", async () => {
    const { result } = renderHook(() => useReferenceStore());

    await act(async () => {
      await result.current.addPageRef();
    });

    expect(result.current.references.length).toBe(1);
  });

  it("should add a selection reference", async () => {
    const { result } = renderHook(() => useReferenceStore());
    expect(result.current.references.length).toBe(0);
    await act(async () => {
      await result.current.addSelectionRef();
    });
    console.log("result", result.current.references);

    expect(result.current.references.length).toBe(1);
  });

  it("should remove a reference", () => {
    const { result } = renderHook(() => useReferenceStore());
    act(() => {
      result.current.addPageRef();
      result.current.addSelectionRef();
    });
    const referenceToRemove = result.current.references[0];
    act(() => {
      result.current.removeRef(referenceToRemove.id);
    });

    expect(result.current.references.length).toBe(1);
    expect(result.current.references[0].id).not.toBe(referenceToRemove.id);
  });

  it("should clear all references", () => {
    const { result } = renderHook(() => useReferenceStore());
    act(() => {
      result.current.addPageRef();
      result.current.addSelectionRef();
    });
    act(() => {
      result.current.clear();
    });

    expect(result.current.references.length).toBe(0);
  });

  // it("should load references from storage", async () => {
  // await (async () => {
  //   const { result } = renderHook(() => useReferenceStore());
  //   await act(async () => {
  //     await result.current.addPageRef();
  //   });
  // })();
  // const { result } = renderHook(() => useReferenceStore());
  // expect(result.current.references.length).toBe(0);
  // await act(async () => {
  //   await result.current.load();
  // });
  //   expect(result2.current.references.length).toBe(1);
  // });
});
