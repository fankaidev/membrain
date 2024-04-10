import { createMockStorage } from "../utils/storage_mock";

const storageMock = createMockStorage();
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
      expect.arrayContaining([expect.objectContaining({ url: "url1" })]),
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
