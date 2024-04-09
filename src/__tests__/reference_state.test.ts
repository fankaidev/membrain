const storageMock = (() => {
  let storage: { [key: string]: string } = {};

  return {
    set: jest.fn((items, callback = () => {}) => {
      return new Promise<void>((resolve) => {
        console.log("set items", items);
        Object.keys(items).forEach((key) => {
          storage[key] = items[key];
        });
        callback();
        resolve();
      });
    }),
    get: jest.fn(async (keys, callback = () => {}) => {
      return new Promise<{ [key: string]: string }>((resolve) => {
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
        resolve(items);
      });
    }),
    clear: jest.fn(() => {
      storage = {};
    }),
  };
})();

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
    .mockImplementation(() => Promise.resolve(new Reference("webpage", "title1", "url1", "page1"))),
  getCurrentSelectionRef: jest
    .fn()
    .mockResolvedValue(() => new Reference("text", "title2", "url2", "text1")),
}));

describe("useReferenceStore", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useReferenceStore());
    act(() => {
      result.current.clear();
    });
  });

  it("should add a page reference", async () => {
    const { result } = renderHook(() => useReferenceStore());
    expect(result.current.references).toEqual([]);

    await act(async () => {
      await result.current.addPageRef();
    });
    expect(result.current.references).toMatchSnapshot([{ title: "title1" }]);

    await act(async () => {
      await result.current.addSelectionRef();
    });
    expect(result.current.references).toMatchSnapshot([{ title: "title1" }, { title: "title2" }]);

    // should ignore duplicate
    await act(async () => {
      await result.current.addPageRef();
    });
    console.log("result1", result.current.references);
    expect(result.current.references).toMatchSnapshot([{ title: "title1" }, { title: "title2" }]);
  });

  it("should add a selection reference", async () => {
    const { result } = renderHook(() => useReferenceStore());
    console.log("result2", result.current.references);
    expect(result.current.references.length).toBe(0);
    await act(async () => {
      await result.current.addSelectionRef();
    });
    console.log("result3", result.current.references.length);

    expect(result.current.references.length).toBe(1);

    act(() => result.current.clear());
    expect(result.current.references.length).toBe(0);
  });

  it("should remove a reference", async () => {
    const { result } = renderHook(() => useReferenceStore());
    await act(async () => {
      await result.current.addPageRef();
      await result.current.addSelectionRef();
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
