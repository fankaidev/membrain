import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Col, Flex, Input, Row, Select, Space } from "antd";
import TextArea from "antd/es/input/TextArea";
import React from "react";
import { ChatReferenceType, PromptTemplate } from "../utils/message";

export const PromptSettings = ({
  promptTemplates,
  setPromptTemplates,
}: {
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
  const addTemplate = () => {
    const value = new PromptTemplate("Prompt", "", "all");
    setPromptTemplates([...promptTemplates, value]);
  };

  return (
    <>
      <Row align="middle">
        <Col span={16}>
          <h2>Prompt Templates</h2>
        </Col>
        <Col span={6} offset={2}>
          <Button icon={<PlusCircleOutlined />} type="text" size="middle" onClick={addTemplate}>
            new
          </Button>
        </Col>
      </Row>

      {promptTemplates.map((tpl) => (
        <>
          <Row style={{ padding: "16px 0px 16px 0px" }}>
            <Col span={21}>
              <Space direction="vertical" id={tpl.id} style={{ width: "100%" }}>
                <Row key="name">
                  <Col span={8} style={{ lineHeight: "2" }}>
                    Name
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
                    Reference
                  </Col>
                  <Col span={16}>
                    <Select
                      style={{ width: "100%" }}
                      options={[
                        { value: "all", label: "All References" },
                        { value: "page", label: "Current Page" },
                        { value: "selection", label: "Current Selection" },
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
                  placeholder="Enter prompt here..."
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
    </>
  );
};
