import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

export const getPageMarkDown = async (tab: chrome.tabs.Tab) => {
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

export const getPageSelectionText = async (tab: chrome.tabs.Tab) => {
  const [ret] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    func: () => {
      return window.getSelection()?.toString();
    },
  });

  return ret.result;
};
