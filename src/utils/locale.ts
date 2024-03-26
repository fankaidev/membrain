const MESSAGES: { [locale: string]: { [key: string]: string } } = {
  en: {
    tag_references: "References",
    button_summarize: "Summarize",
    button_summarizePage: "Summarize Page",
    button_summarizeSelection: "Summarize Selection",
    tooltip_addCurrentPage: "add current page",
    tooltip_addSelection: "add selection",
    tooltip_clearReferences: "clear all",
    tooltip_sendMessage: "send(cmd+enter)",
    tooltip_clearChats: "clear all",
    prompt_summarize: "summarize the content in the references",
    prompt_summarizePage: "summarize the content in this page",
    prompt_summarizeSelection: "summarize the content in this selection",
    prompt_system:
      "You are a smart assistant, please try to answer user's questions as accurately as possible.",
    prompt_useReferences: "Please refer to the following materials in your answers:",
    input_placeholder: "Cmd + Enter to send",
  },
  zh: {
    tag_references: "参考资料",
    button_summarize: "总结",
    button_summarizePage: "总结页面",
    button_summarizeSelection: "总结选中内容",
    tooltip_addCurrentPage: "添加当前页面",
    tooltip_addSelection: "添加选中内容",
    tooltip_clearReferences: "清空参考资料",
    tooltip_sendMessage: "发送(cmd+enter)",
    tooltip_clearChats: "清空对话",
    prompt_summarize: "总结参考资料里的内容",
    prompt_summarizePage: "总结这个页面的内容",
    prompt_summarizeSelection: "具体分析网页中的这段内容",
    prompt_system: "你是一个智能助手，请尽量准确的回答用户的问题。",
    prompt_useReferences: "请参考以下的资料来回答：",
    input_placeholder: "Cmd + Enter 发送",
  },
};

export const getLocaleMessage = (locale: string, key: string): string => {
  return MESSAGES[locale][key];
};
