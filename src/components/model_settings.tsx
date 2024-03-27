import { Col, Divider, Input, Row, Switch } from "antd";
import React from "react";
import { Language, MODELS, MODEL_PROVIDERS, ModelProvider, ProviderConfig } from "../utils/config";
import { BlankDiv } from "./common";

export const ModelSettings = ({
  language,
  providerConfigs,
  setProviderConfigs,
}: {
  language: Language;
  providerConfigs: Record<string, ProviderConfig>;
  setProviderConfigs: (values: Record<string, ProviderConfig>) => void;
}) => {
  const updateProviderConfig = (config: ProviderConfig) => {
    const values = { ...providerConfigs };
    values[config.name] = config;
    setProviderConfigs(values);
  };

  const displayProviderSettings = (provider: ModelProvider) => {
    const config =
      providerConfigs[provider.name] || new ProviderConfig(provider.name, false, "", []);
    const models = MODELS.filter((model) => model.provider === provider.name);
    return (
      <div key={provider.name}>
        <Row style={{ width: "100%" }} align={"middle"}>
          <Col span={21} style={{ lineHeight: "2" }}>
            <b>{provider.name}</b>
          </Col>
          <Col span={3}>
            <Switch
              checked={config.enabled}
              onChange={(checked) => {
                config.enabled = checked;
                updateProviderConfig(config);
              }}
            />
          </Col>
        </Row>
        {config.enabled && (
          <>
            <BlankDiv />
            <Row style={{ width: "100%" }}>
              <Input
                value={config.apiKey}
                onChange={(e) => {
                  config.apiKey = e.target.value;
                  updateProviderConfig(config);
                }}
                placeholder={`${provider.name} API Key`}
              />
            </Row>
            <BlankDiv />

            {models.map((model) => {
              return (
                <Row key={model.name} style={{ width: "100%" }}>
                  <Col span={22} style={{ lineHeight: "2" }}>
                    {model.name}
                  </Col>
                  <Col span={2}>
                    <Switch
                      size="small"
                      checked={config.enabledModels.includes(model.name)}
                      onChange={(checked) => {
                        if (checked) {
                          config.enabledModels.push(model.name);
                        } else {
                          config.enabledModels = config.enabledModels.filter(
                            (m) => m !== model.name
                          );
                        }
                        updateProviderConfig(config);
                      }}
                    />
                  </Col>
                </Row>
              );
            })}
          </>
        )}
        <Divider />
      </div>
    );
  };

  return <>{MODEL_PROVIDERS.map((provider) => displayProviderSettings(provider))}</>;
};
