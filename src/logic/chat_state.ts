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
  currentModel: ModelAndProvider | null;
  history: Message[];
  loaded: boolean;
  setChatStatus: (val: string) => void;
  setChatTask: (val: ChatTask | null) => void;
  setTemperature: (val: number) => void;
  setPromptTemplates: (val: PromptTemplate[]) => void;
  setCustomModels: (val: Model[]) => void;
  setCustomProviders: (val: ModelProvider[]) => void;
  setProviderConfigs: (val: Record<string, ProviderConfig>) => void;
  setCurrentModel: (val: ModelAndProvider | null) => void;
  setHistory: (val: Message[]) => void;
  getAllModels: () => Model[];
  getAllProviders: () => ModelProvider[];
  getEnabledModels(): ModelAndProvider[];
  loadChatState: () => Promise<void>;
  clearChatSession: () => void;
  refreshCurrentModel: () => void;
};

export const useChatState = create<ChatState>((set, get) => ({
  chatStatus: CHAT_STATUS_EMPTY,
  chatTask: null,
  temperature: 0.3,
  promptTemplates: [],
  customModels: [],
  customProviders: [],
  providerConfigs: {},
  currentModel: null,
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
    get().refreshCurrentModel();
  },
  setCustomProviders: (val: ModelProvider[]) => {
    set({ customProviders: val });
    saveToStorage("sync", "customProviders", val);
    get().refreshCurrentModel();
  },
  setProviderConfigs: (val: Record<string, ProviderConfig>) => {
    set({ providerConfigs: val });
    saveToStorage("sync", "providerConfigs", val);
    get().refreshCurrentModel();
  },
  setCurrentModel: (val: ModelAndProvider | null) => {
    set({ currentModel: val });
    saveToStorage("sync", "currentModelId", val?.model.id);
    get().refreshCurrentModel();
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
  loadChatState: async () => {
    const temperature = await getFromStorage("sync", "temperature", 0.3);
    const promptTemplates = await getFromStorage("sync", "promptTemplates", []);
    const customModels = await getFromStorage("sync", "customModels", []);
    const customProviders = await getFromStorage("sync", "customProviders", []);
    const providerConfigs = await getFromStorage("sync", "providerConfigs", {});
    const history = await getFromStorage("local", "history", []);
    set({ temperature, promptTemplates, customModels, customProviders, providerConfigs, history });

    const currentModelId = await getFromStorage("sync", "currentModelId", null);
    const currentModel = get()
      .getEnabledModels()
      .find((m) => m.model.id === currentModelId);
    if (currentModel) {
      get().setCurrentModel(currentModel);
    }

    console.debug("loaded enabled models:", get().getEnabledModels());
    console.debug("loaded selectedModel", currentModelId, currentModel);
    set({ loaded: true });
  },
  clearChatSession: () => {
    const { setChatTask, setChatStatus, setHistory } = get();
    setChatStatus(CHAT_STATUS_EMPTY);
    setChatTask(null);
    setHistory([]);
  },
  refreshCurrentModel: () => {
    const { getEnabledModels, setCurrentModel, currentModel } = get();
    const enabledModels = getEnabledModels();

    const isCurrentModelValid = (): boolean => {
      if (currentModel === null) {
        return false;
      }
      const { model, provider } = currentModel;
      return !!enabledModels.find((mp) => mp.model.id == model.id && mp.provider.id == provider.id);
    };

    const getValidModel = () => {
      if (enabledModels.length === 0) {
        return null;
      }
      if (enabledModels.length > 0 && !isCurrentModelValid()) {
        return enabledModels[0];
      }
      return currentModel;
    };

    const model = getValidModel();
    if (model !== currentModel) {
      console.debug("set current model", model);
      setCurrentModel(model);
    }
  },
}));
