import { Col, Row, Select, Space, message } from "antd";
import React from "react";
import { useAppState } from "../logic/app_state";
import { CHAT_LANGUAGES, TXT, UI_LANGUAGES } from "../utils/locale";

export const GeneralSettings = ({}: {}) => {
  const { setUILanguage, setChatLanguage, UILanguage, chatLanguage, displayText } = useAppState();

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
