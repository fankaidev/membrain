import { EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Col, Divider, Form, Input, Modal, Row, Select, Switch, Tooltip } from "antd";
import React, { useState } from "react";
import {
  Language,
  Model,
  ModelProvider,
  ProviderConfig,
  SYSTEM_MODELS,
  SYSTEM_PROVIDERS,
} from "../utils/config";
import { BlankDiv } from "./common";

export const ModelSettings = ({
  language,
  providerConfigs,
  setProviderConfigs,
  customModels,
  setCustomModels,
  customProviders,
  setCustomProviders,
}: {
  language: Language;
  providerConfigs: Record<string, ProviderConfig>;
  setProviderConfigs: (values: Record<string, ProviderConfig>) => void;
  customModels: Model[];
  setCustomModels: (models: Model[]) => void;
  customProviders: ModelProvider[];
  setCustomProviders: (providers: ModelProvider[]) => void;
}) => {
  const [openProviderModal, setOpenProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ModelProvider | null>(null);
  const [providerForm] = Form.useForm();
  const [openModelModal, setOpenModelModal] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [modelForm] = Form.useForm();
  const allModels = SYSTEM_MODELS.concat(customModels);
  const allProviders = SYSTEM_PROVIDERS.concat(customProviders);

  const updateProviderConfig = (config: ProviderConfig) => {
    const values = { ...providerConfigs };
    values[config.providerId] = config;
    setProviderConfigs(values);
  };

  const upsertProvider = () => {
    providerForm.validateFields().then((values) => {
      console.debug("provider=", editingProvider, "model=", editingModel, "value=", values);
      if (editingProvider) {
        const provider = new ModelProvider(
          values.name,
          values.apiType,
          values.endpoint,
          editingProvider.id
        );
        setCustomProviders(
          customProviders.map((p) => (p.id === editingProvider.id ? provider : p))
        );
      } else {
        const provider = new ModelProvider(values.name, "OpenAI", values.endpoint);
        setCustomProviders([...customProviders, provider]);
        const config = new ProviderConfig(provider.id, true, "", []);
        updateProviderConfig(config);
      }
      setOpenProviderModal(false);
      setEditingModel(null);
      setEditingProvider(null);
    });
  };

  const upsertModel = () => {
    modelForm.validateFields().then((values) => {
      console.debug("provider=", editingProvider, "model=", editingModel, "value=", values);
      if (editingModel) {
        const model = new Model(
          editingModel.providerId,
          values.name,
          values.maxTokens,
          editingModel.id
        );
        setCustomModels(customModels.map((m) => (m.id === editingModel.id ? model : m)));
      } else {
        const model = new Model(editingProvider!.id, values.name, values.maxTokens);
        setCustomModels([...customModels, model]);
        const config = providerConfigs[editingProvider!.id];
        config.enabledModels.push(model.name);
        updateProviderConfig(config);
      }
      setOpenModelModal(false);
      setEditingModel(null);
      setEditingProvider(null);
    });
  };

  const deleteProvider = () => {
    console.debug("delete provider=", editingProvider);
    setOpenProviderModal(false);
    setEditingModel(null);
    setEditingProvider(null);
    setCustomProviders(customProviders.filter((p) => p.id !== editingProvider?.id));
    setCustomModels(customModels.filter((m) => m.providerId !== editingProvider?.id));
  };

  const deleteModel = () => {
    console.debug("delete provider=", editingProvider, "model=", editingModel);
    setOpenModelModal(false);
    setEditingModel(null);
    setEditingProvider(null);
    setCustomModels(customModels.filter((m) => m.id !== editingModel?.id));
  };
  const startAddingModel = (provider: ModelProvider) => {
    setEditingProvider(provider);
    modelForm.resetFields();
    setOpenModelModal(true);
  };

  const startEditingModel = (provider: ModelProvider, model: Model) => {
    setEditingProvider(provider);
    setEditingModel(model);
    modelForm.setFieldsValue(model);
    setOpenModelModal(true);
  };

  const startAddingProvider = () => {
    providerForm.resetFields();
    setOpenProviderModal(true);
  };

  const startEditingProvider = (provider: ModelProvider) => {
    setEditingProvider(provider);
    providerForm.setFieldsValue(provider);
    setOpenProviderModal(true);
  };

  const displayProviderRow = (provider: ModelProvider, config: ProviderConfig) => {
    const toggleProvider = (checked: boolean) => {
      if (checked) {
        const providerModels = allModels.filter((model) => model.providerId === provider.id);
        config.enabledModels = providerModels.map((model) => model.name);
      } else {
        config.enabledModels = [];
      }
      config.enabled = checked;
      updateProviderConfig(config);
    };

    return (
      <Row
        key={provider.id}
        data-testid={`providerHeader`}
        style={{ width: "100%" }}
        align={"middle"}
      >
        <Col span={16} style={{ lineHeight: "2" }}>
          <b>{provider.name}</b>
        </Col>
        <Col span={2} offset={1}>
          {customProviders.includes(provider) && (
            <Tooltip title="edit provider">
              <EditOutlined onClick={() => startEditingProvider(provider)} />
            </Tooltip>
          )}
        </Col>

        <Col span={2}>
          <Tooltip title="add model">
            <PlusCircleOutlined onClick={() => startAddingModel(provider)} />
          </Tooltip>
        </Col>
        <Col span={3}>
          <Switch checked={config.enabled} onChange={toggleProvider} />
        </Col>
      </Row>
    );
  };

  const displayModelRow = (provider: ModelProvider, config: ProviderConfig, model: Model) => {
    const toggleModel = (checked: boolean) => {
      if (checked) {
        config.enabledModels.push(model.name);
      } else {
        config.enabledModels = config.enabledModels.filter((m) => m !== model.name);
      }
      updateProviderConfig(config);
    };

    return (
      <Row key={model.id} style={{ width: "100%" }} data-testid={`model_${model.name}`}>
        <Col span={20} style={{ lineHeight: "2" }}>
          {model.name}
        </Col>
        <Col span={2}>
          {customModels.includes(model) && (
            <Tooltip title="edit model">
              <EditOutlined onClick={() => startEditingModel(provider, model)} />
            </Tooltip>
          )}
        </Col>
        <Col span={2}>
          <Switch
            size="small"
            checked={config.enabledModels.includes(model.name)}
            onChange={toggleModel}
          />
        </Col>
      </Row>
    );
  };

  const displayModelModal = () => {
    return (
      <Modal
        open={openModelModal}
        title="Model"
        data-testid="model_modal"
        footer={[
          <Button key="cancel" onClick={() => setOpenModelModal(false)}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={deleteModel}
            disabled={!editingModel || !customModels.includes(editingModel)}
          >
            Delete
          </Button>,
          <Button key="submit" type="primary" onClick={upsertModel}>
            Submit
          </Button>,
        ]}
      >
        <Form form={modelForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="maxTokens" label="Max Tokens" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  const displayProviderModal = () => {
    return (
      <Modal
        open={openProviderModal}
        onOk={upsertProvider}
        onCancel={() => setOpenProviderModal(false)}
        title="Provider"
        data-testid="providerModal"
        footer={[
          <Button key="cancel" onClick={() => setOpenProviderModal(false)}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={deleteProvider}
            disabled={!editingProvider || !customProviders.includes(editingProvider)}
          >
            Delete
          </Button>,
          <Button key="submit" type="primary" onClick={upsertProvider}>
            Submit
          </Button>,
        ]}
      >
        <Form form={providerForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="apiType"
            label="Api Type"
            initialValue={"OpenAI"}
            rules={[{ required: true }]}
          >
            <Select options={[{ value: "OpenAI" }, { value: "Google" }, { value: "Anthropic" }]} />
          </Form.Item>
          <Form.Item name="endpoint" label="Endpoint" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  const displayProviderSettings = (provider: ModelProvider) => {
    const config = providerConfigs[provider.id] || new ProviderConfig(provider.id, false, "", []);
    const providerModels = allModels.filter((model) => model.providerId === provider.id);
    return (
      <div key={provider.id} data-testid={`provider_${provider.name}`}>
        {displayProviderRow(provider, config)}
        {config.enabled && (
          <>
            <BlankDiv />
            <Row key={"apiKey"}>
              <Input
                value={config.apiKey}
                placeholder={`${provider.name} API Key`}
                onChange={(e) => {
                  config.apiKey = e.target.value;
                  updateProviderConfig(config);
                }}
              />
            </Row>
            <BlankDiv />
            {providerModels.map((model) => displayModelRow(provider, config, model))}
          </>
        )}
        <Divider />
      </div>
    );
  };

  return (
    <>
      {allProviders.map((provider) => displayProviderSettings(provider))}
      {displayModelModal()}
      {displayProviderModal()}
      <Row justify="center">
        <Button onClick={startAddingProvider}>Add Provider</Button>
      </Row>
    </>
  );
};
