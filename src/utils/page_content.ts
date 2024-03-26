import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { Reference } from "./message";

const getCurrentTab = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!tab || !tab.url) {
    return null;
  }
  if (tab.url!.includes("chrome://")) {
    console.debug("skip page:", tab.url ? tab.url : "");
    return null;
  }
  return tab;
};

const getPageMarkDown = async (tab: chrome.tabs.Tab) => {
  const [ret] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    func: () => {
      return document.documentElement.outerHTML;
    },
  });

  const doc = new DOMParser().parseFromString(ret.result as string, "text/html");
  const article = new Readability(doc).parse();
  console.debug("article=", article);

  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(article?.content || "");
  console.debug("markdown=", markdown);

  return markdown;
};

const getPageSelectionText = async (tab: chrome.tabs.Tab) => {
  const [ret] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    func: () => {
      return window.getSelection()?.toString();
    },
  });

  return ret.result;
};

export const getCurrentSelection = async () => {
  const tab = await getCurrentTab();
  if (!tab) {
    return null;
  }

  return await getPageSelectionText(tab);
};

export const getCurrentPageRef = async () => {
  const tab = await getCurrentTab();
  if (!tab) {
    return null;
  }
  const content = await getPageMarkDown(tab);
  if (!content) {
    return null;
  }
  const pageRef = new Reference("webpage", tab.title!, tab.url!, content);
  return pageRef;
};
