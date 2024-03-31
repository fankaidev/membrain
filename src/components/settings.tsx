import { Col, Row, Select, Space, message } from "antd";
import React, { useContext } from "react";
import { CHAT_LANGUAGES, TXT, UI_LANGUAGES } from "../utils/locale";
import { LocaleContext } from "./locale_context";

export const GeneralSettings = ({
  UILanguage,
  setUILanguage,
  chatLanguage,
  setChatLanguage,
}: {
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

  const { displayText } = useContext(LocaleContext)!;

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Row align={"middle"}>
        <Col span={12}>{displayText(TXT.LABEL_LANG_UI)}</Col>
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
        <Col span={12}>{displayText(TXT.LABEL_LANG_CHAT)}</Col>
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
