import {
  WA_MENU_EXPLAIN_SELECTION,
  WA_MENU_OPEN,
  WA_MENU_SUMMARIZE_PAGE,
  WA_MENU_TASK_EXPLAIN_SELECTION,
  WA_MENU_TASK_SUMMARIZE_PAGE,
  WA_MESSAGE_TYPE_MENU_TASK,
  WA_MESSAGE_TYPE_OPEN,
} from "./utils/config";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: WA_MENU_OPEN,
    title: "Open MemBrain",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    id: WA_MENU_SUMMARIZE_PAGE,
    title: "Summarize Page",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    id: WA_MENU_EXPLAIN_SELECTION,
    title: "Explain Selection",
    contexts: ["selection"],
  });
});

chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  console.log("on click", tab);
  if (tab) {
    chrome.sidePanel.open({ windowId: tab.windowId, tabId: tab.id });
  }
});

chrome.contextMenus.onClicked.addListener(
  async (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    console.debug("on menu", info.menuItemId, tab, info);
    if (!tab) {
      return;
    }
    if (info.menuItemId === WA_MENU_OPEN) {
      chrome.sidePanel.open({ windowId: tab.windowId, tabId: tab.id });
    } else if (info.menuItemId === WA_MENU_SUMMARIZE_PAGE) {
      await chrome.sidePanel.open({ windowId: tab.windowId, tabId: tab.id });
      await chrome.storage.local.set({
        menuTask: { windowId: tab.windowId, name: WA_MENU_TASK_SUMMARIZE_PAGE },
      });
      chrome.runtime.sendMessage({ type: WA_MESSAGE_TYPE_MENU_TASK });
    } else if (info.menuItemId === WA_MENU_EXPLAIN_SELECTION) {
      await chrome.sidePanel.open({ windowId: tab.windowId, tabId: tab.id });
      await chrome.storage.local.set({
        menuTask: {
          windowId: tab.windowId,
          name: WA_MENU_TASK_EXPLAIN_SELECTION,
          text: info.selectionText,
        },
      });
      chrome.runtime.sendMessage({ type: WA_MESSAGE_TYPE_MENU_TASK });
    }
  }
);

chrome.runtime.onMessage.addListener(
  (message: { type: string }, sender: chrome.runtime.MessageSender) => {
    if (message.type === WA_MESSAGE_TYPE_OPEN) {
      console.log("on message", message, sender);
      if (sender.tab && sender.tab.id) {
        chrome.sidePanel.open({ tabId: sender.tab.id });
      }
    }
  }
);
