import { Row, Select } from "antd";
import React from "react";
import { Language } from "../utils/config";

export const Settings = ({
  language,
  setLanguage,
}: {
  language: Language;
  setLanguage: (value: Language) => void;
}) => {
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
    </>
  );
};
