import { Col, Input, Row, Select } from "antd";
import React from "react";
import { BlankDiv } from "../assistant";
import { LLM_MODELS, Language } from "../utils/config";

export const Settings = ({
  language,
  setLanguage,
  apiKeys,
  setApiKeys,
}: {
  language: Language;
  setLanguage: (value: Language) => void;
  apiKeys: Record<string, string>;
  setApiKeys: (values: Record<string, string>) => void;
}) => {
  const saveKey = (model: string, apiKey: string) => {
    const values = { ...apiKeys };
    values[model] = apiKey;
    setApiKeys(values);
    console.debug("saved api keys", model, apiKey, apiKeys, values);
  };

  const changeLanguage = (value: string) => {
    setLanguage(value as Language);
  };

  return (
    <>
      <Row justify={"center"} key="lang-header">
        <h3>Language</h3>
      </Row>
      <Row justify={"center"} key="lang">
        <Select
          value={language}
          onChange={changeLanguage}
          style={{ width: 120 }}
          options={[
            { value: "en", label: "English" },
            { value: "zh", label: "Chinese" },
          ]}
        />
      </Row>
      <Row justify={"center"} key="keys-header">
        <h3>API Keys</h3>
      </Row>
      {LLM_MODELS.map((model: string) => (
        <React.Fragment key={model}>
          <Row>
            <Col span={4} offset={1} style={{ lineHeight: "2" }}>
              {model}
            </Col>
            <Col span={18}>
              <Input value={apiKeys[model]} onChange={(e) => saveKey(model, e.target.value)} />
            </Col>
          </Row>
          <BlankDiv height={4} />
        </React.Fragment>
      ))}
    </>
  );
};
