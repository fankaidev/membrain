import { Col, Row, Select, Space, message } from "antd";
import React from "react";
import { CHAT_LANGUAGES, UI_LANGUAGES } from "../utils/locale";

export const GeneralSettings = ({
  displayText,
  UILanguage,
  setUILanguage,
  chatLanguage,
  setChatLanguage,
}: {
  displayText: (text: string) => string;
  UILanguage: string;
  setUILanguage: (value: string) => void;
  chatLanguage: string;
  setChatLanguage: (value: string) => void;
}) => {
  const changeUILanguage = (value: string) => {
    setUILanguage(value);
    message.success(`Language changed to ${value}`, 1);
  };

  const changeChatLanguage = (value: string) => {
    setChatLanguage(value);
    message.success(`Chat Language changed to ${value}`, 1);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Row align={"middle"}>
        <Col span={12}>{displayText("label_uiLanguages")}</Col>
        <Col span={12}>
          <Select
            value={UILanguage}
            onChange={changeUILanguage}
            style={{ width: "100%" }}
            options={UI_LANGUAGES}
          />
        </Col>
      </Row>
      <Row align={"middle"}>
        <Col span={12}>{displayText("label_chatLanguages")}</Col>
        <Col span={12}>
          <Select
            value={chatLanguage}
            onChange={changeChatLanguage}
            style={{ width: "100%" }}
            options={CHAT_LANGUAGES}
          />
        </Col>
      </Row>
    </Space>
  );
};
