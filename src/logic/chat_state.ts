import { create } from "zustand";
import {
  Model,
  ModelAndProvider,
  ModelProvider,
  ProviderConfig,
  SYSTEM_MODELS,
  SYSTEM_PROVIDERS,
} from "../utils/config";
import { CHAT_STATUS_EMPTY, ChatTask, Message, PromptTemplate } from "../utils/message";
import { getFromStorage, saveToStorage } from "./chrome_storage";

export type ChatState = {
  chatStatus: string;
  chatTask: ChatTask | null;
  temperature: number;
  promptTemplates: PromptTemplate[];
  customModels: Model[];
  customProviders: ModelProvider[];
  providerConfigs: Record<string, ProviderConfig>;
  selectedModel: ModelAndProvider | null;
  history: Message[];
  loaded: boolean;
  setChatStatus: (val: string) => void;
  setChatTask: (val: ChatTask | null) => void;
  setTemperature: (val: number) => void;
  setPromptTemplates: (val: PromptTemplate[]) => void;
  setCustomModels: (val: Model[]) => void;
  setCustomProviders: (val: ModelProvider[]) => void;
  setProviderConfigs: (val: Record<string, ProviderConfig>) => void;
  setSelectedModel: (val: ModelAndProvider | null) => void;
  setHistory: (val: Message[]) => void;
  getAllModels: () => Model[];
  getAllProviders: () => ModelProvider[];
  getEnabledModels(): ModelAndProvider[];
  getCurrentModel: () => ModelAndProvider | null;
  loadChatState: () => Promise<void>;
  clearChatSession: () => void;
};

export const useChatState = create<ChatState>((set, get) => ({
  chatStatus: CHAT_STATUS_EMPTY,
  chatTask: null,
  temperature: 0.3,
  promptTemplates: [],
  customModels: [],
  customProviders: [],
  providerConfigs: {},
  selectedModel: null,
  history: [],
  loaded: false,
  setChatStatus: (val: string) => {
    console.debug("setChatStatus", val);
    set({ chatStatus: val });
  },
  setChatTask: (val: ChatTask | null) => {
    set({ chatTask: val });
  },
  setTemperature: (val: number) => {
    set({ temperature: val });
    saveToStorage("sync", "temperature", val);
  },
  setPromptTemplates: (val: PromptTemplate[]) => {
    set({ promptTemplates: val });
    saveToStorage("sync", "promptTemplates", val);
  },
  setCustomModels: (val: Model[]) => {
    set({ customModels: val });
    saveToStorage("sync", "customModels", val);
  },
  setCustomProviders: (val: ModelProvider[]) => {
    set({ customProviders: val });
    saveToStorage("sync", "customProviders", val);
  },
  setProviderConfigs: (val: Record<string, ProviderConfig>) => {
    set({ providerConfigs: val });
    saveToStorage("sync", "providerConfigs", val);
  },
  setSelectedModel: (val: ModelAndProvider | null) => {
    set({ selectedModel: val });
    console.debug("setSelectedModel", val?.model.id);
    saveToStorage("sync", "selectedModelId", val?.model.id);
  },
  setHistory: (val: Message[]) => {
    set({ history: val });
    saveToStorage("local", "history", val);
  },
  getAllModels: () => {
    return [...SYSTEM_MODELS, ...get().customModels];
  },
  getAllProviders: () => {
    return [...SYSTEM_PROVIDERS, ...get().customProviders];
  },
  getEnabledModels: () => {
    const { getAllProviders, providerConfigs, getAllModels } = get();
    return getAllProviders()
      .map((p) => [p, providerConfigs[p.id]] as [ModelProvider, ProviderConfig])
      .filter(([p, c]) => c && c.enabled)
      .flatMap(([p, c]) =>
        getAllModels()
          .filter((m) => m.providerId === p.id && c.enabledModels.includes(m.name))
          .map((m) => new ModelAndProvider(m, p)),
      );
  },
  getCurrentModel: () => {
    const { getEnabledModels, selectedModel } = get();
    const enabledModels = getEnabledModels();

    const isSelectedModelValid = (): boolean => {
      if (selectedModel === null) {
        return false;
      }
      const { model, provider } = selectedModel;
      return !!enabledModels.find((mp) => mp.model.id == model.id && mp.provider.id == provider.id);
    };

    if (enabledModels.length === 0) {
      return null;
    }
    if (enabledModels.length > 0 && !isSelectedModelValid()) {
      set({ selectedModel: enabledModels[0] });
      return enabledModels[0];
    }
    return selectedModel;
  },
  loadChatState: async () => {
    const temperature = await getFromStorage("sync", "temperature", 0.3);
    const promptTemplates = await getFromStorage("sync", "promptTemplates", []);
    const customModels = await getFromStorage("sync", "customModels", []);
    const customProviders = await getFromStorage("sync", "customProviders", []);
    const providerConfigs = await getFromStorage("sync", "providerConfigs", {});
    const history = await getFromStorage("local", "history", []);
    set({ temperature, promptTemplates, customModels, customProviders, providerConfigs, history });

    const selectedModelId = await getFromStorage("sync", "selectedModelId", null);
    const selectedModel = get()
      .getEnabledModels()
      .find((m) => m.model.id === selectedModelId);
    if (selectedModel) {
      set({ selectedModel });
    }

    console.debug("loaded enabled models:", get().getEnabledModels());
    console.debug("loaded selectedModel", selectedModelId, selectedModel);
    set({ loaded: true });
  },
  clearChatSession: () => {
    set({
      chatStatus: CHAT_STATUS_EMPTY,
      chatTask: null,
      history: [],
    });
  },
}));
