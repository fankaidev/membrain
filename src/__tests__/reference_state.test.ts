const storageMock = (() => {
  let storage: { [key: string]: string } = {};

  return {
    set: jest.fn((items, callback = () => {}) => {
      return new Promise<void>((resolve) => {
        Object.keys(items).forEach((key) => {
          storage[key] = items[key];
        });
        console.log("set items", items);
        callback();
        resolve();
      });
    }),
    get: jest.fn(async (keys, callback = () => {}) => {
      return new Promise<{ [key: string]: string }>((resolve) => {
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
        console.log("get keys", keys, items);
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
    // @ts-ignore
    sync: storageMock,
  },
};

import { act, renderHook } from "@testing-library/react";
import { useReferenceState } from "../logic/reference_state";
import { Reference } from "../utils/message";

jest.mock("../utils/page_content", () => ({
  getCurrentPageRef: jest
    .fn()
    .mockImplementation(() => Promise.resolve(new Reference("webpage", "title1", "url1", "page1"))),
  getCurrentSelectionRef: jest
    .fn()
    .mockImplementation(() => Promise.resolve(new Reference("text", "title2", "url2", "text2"))),
}));

describe("useReferenceState", () => {
  beforeEach(async () => {
    const { result: state } = renderHook(() => useReferenceState());
    await act(async () => {
      await state.current.clearReferences();
    });
  });

  it("when inited", () => {
    const { result: state } = renderHook(() => useReferenceState());
    expect(state.current.references).toEqual([]);
  });

  it("when references added", async () => {
    const { result: state } = renderHook(() => useReferenceState());

    await act(async () => {
      await state.current.addPageRef();
    });
    expect(state.current.references).toEqual(
      expect.arrayContaining([expect.objectContaining({ url: "url1" })])
    );

    await act(async () => {
      await state.current.addSelectionRef();
    });
    expect(state.current.references.map((r: Reference) => r.url)).toEqual(["url1", "url2"]);

    // should ignore duplicate web page
    await act(async () => {
      await state.current.addPageRef();
    });
    expect(state.current.references.map((r: Reference) => r.url)).toEqual(["url1", "url2"]);

    // should add another selection
    await act(async () => {
      await state.current.addSelectionRef();
    });
    expect(state.current.references.map((r: Reference) => r.url)).toEqual(["url1", "url2", "url2"]);
  });

  it("when references removed", async () => {
    const { result: state } = renderHook(() => useReferenceState());

    // given
    await act(async () => {
      await state.current.addPageRef();
      await state.current.addSelectionRef();
    });
    expect(state.current.references.map((r: Reference) => r.url)).toEqual(["url1", "url2"]);

    // when
    await act(async () => {
      await state.current.removeRef(state.current.references[0].id);
    });

    // then
    expect(state.current.references.map((r: Reference) => r.url)).toEqual(["url2"]);
  });
});
