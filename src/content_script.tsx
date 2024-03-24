console.log("content script loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fill_input") {
    console.log("fill input message received", message, sender);

    const clickEvent = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    const editableNode = document.querySelector('[contenteditable="true"]');
    const contentNode = document.querySelector('[data-slate-leaf="true"]');
    if (editableNode && contentNode) {
      editableNode?.dispatchEvent(clickEvent);
      contentNode.innerHTML = `<span data-slate-string="true">abcdefg</span>`;
    } else {
      console.error("content node not found");
    }

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", code: "Enter", which: 13 })
    );
    document.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", which: 13 }));
    sendResponse({ status: "completed" });
  }
  return true;
});
