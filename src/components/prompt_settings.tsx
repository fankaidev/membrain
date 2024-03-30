import { MinusCircleOutlined } from "@ant-design/icons";
import { Button, Col, Flex, Input, Row, Select, Space } from "antd";
import TextArea from "antd/es/input/TextArea";
import React from "react";
import { ChatReferenceType, PromptTemplate } from "../utils/message";

export const PromptSettings = ({
  displayText,
  promptTemplates,
  setPromptTemplates,
}: {
  displayText: (text: string) => string;
  promptTemplates: PromptTemplate[];
  setPromptTemplates: (tasks: PromptTemplate[]) => void;
}) => {
  const updateTemplatePrompt = (id: string, prompt: string) => {
    const index = promptTemplates.findIndex((tpl) => tpl.id === id);
    if (index >= 0) {
      const newTemplates = [...promptTemplates];
      newTemplates[index].prompt = prompt;
      setPromptTemplates(newTemplates);
    }
  };
  const updateTemplateName = (id: string, name: string) => {
    const index = promptTemplates.findIndex((tpl) => tpl.id === id);
    if (index >= 0) {
      const newTemplates = [...promptTemplates];
      newTemplates[index].name = name;
      setPromptTemplates(newTemplates);
    }
  };
  const updateTemplateRefType = (id: string, refType: ChatReferenceType) => {
    const index = promptTemplates.findIndex((tpl) => tpl.id === id);
    if (index >= 0) {
      const newTemplates = [...promptTemplates];
      newTemplates[index].reference_type = refType;
      setPromptTemplates(newTemplates);
    }
  };
  const removeTemplate = (id: string) => {
    const index = promptTemplates.findIndex((tpl) => tpl.id === id);
    if (index >= 0) {
      const newTemplates = [...promptTemplates];
      newTemplates.splice(index, 1);
      setPromptTemplates(newTemplates);
    }
  };
  const addPromptTemplate = () => {
    const value = new PromptTemplate(displayText("input_defaultPromptName"), "", "all");
    setPromptTemplates([...promptTemplates, value]);
  };

  return (
    <>
      {promptTemplates.map((tpl) => (
        <>
          <Row style={{ padding: "16px 0px 16px 0px" }} key={tpl.id}>
            <Col span={21}>
              <Space direction="vertical" id={tpl.id} style={{ width: "100%" }}>
                <Row key="name">
                  <Col span={8} style={{ lineHeight: "2" }}>
                    {displayText("label_name")}
                  </Col>
                  <Col span={16}>
                    <Input
                      value={tpl.name}
                      onChange={(e) => updateTemplateName(tpl.id, e.target.value)}
                    />
                  </Col>
                </Row>

                <Row key="ref_type">
                  <Col span={8} style={{ lineHeight: "2" }}>
                    {displayText("label_refType")}
                  </Col>
                  <Col span={16}>
                    <Select
                      style={{ width: "100%" }}
                      options={[
                        { value: "all", label: displayText("label_refTypeAll") },
                        { value: "page", label: displayText("label_refTypePage") },
                        { value: "selection", label: displayText("label_refTypeSelection") },
                      ]}
                      value={tpl.reference_type}
                      onChange={(val) => {
                        updateTemplateRefType(tpl.id, val);
                      }}
                    />
                  </Col>
                </Row>
                <TextArea
                  value={tpl.prompt}
                  onChange={(e) => updateTemplatePrompt(tpl.id, e.target.value)}
                  autoSize={{ maxRows: 4 }}
                  placeholder={displayText("input_customPrompt")}
                />
              </Space>
            </Col>
            <Col span={2} offset={1} style={{ borderLeft: "1px solid lightgray" }}>
              <Flex dir="row" align="center" justify="end" style={{ height: "100%" }}>
                <Button
                  icon={<MinusCircleOutlined />}
                  type="text"
                  size="small"
                  danger
                  onClick={() => removeTemplate(tpl.id)}
                />
              </Flex>
            </Col>
          </Row>
        </>
      ))}

      <Row justify="center">
        <Button onClick={addPromptTemplate}>{displayText("button_addPromptTemplate")}</Button>
      </Row>
    </>
  );
};
