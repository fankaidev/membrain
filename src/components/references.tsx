import { DeleteOutlined, FileAddOutlined, FileTextOutlined } from "@ant-design/icons";
import { Button, Collapse, Flex, Tag, Tooltip } from "antd";
import markdownit from "markdown-it";
import React from "react";
import { BlankDiv } from "../assistant";
import { getLocaleMessage } from "../utils/locale";
import { Reference } from "../utils/message";
import { getCurrentPageRef, getCurrentSelection } from "../utils/page_content";

export const addPageToReference = async (
  references: Reference[],
  setReferences: (value: Reference[]) => void
): Promise<Reference | null> => {
  const pageRef = await getCurrentPageRef();
  if (!pageRef) {
    return null;
  }

  if (references.filter((r) => r.type === "webpage" && r.url === pageRef.url).length === 0) {
    setReferences([...references, pageRef]);
  } else {
    console.debug("skip adding existing reference");
  }
  return pageRef;
};

export const ReferenceBox = ({
  lang,
  references,
  setReferences,
}: {
  lang: string;
  references: Reference[];
  setReferences: (value: Reference[]) => void;
}) => {
  const md = markdownit();

  const ellipse = (text: string, limit: number = 70) => {
    let ret = "";
    let cost = 0;
    for (let i = 0; i < text.length; i++) {
      cost += text.charCodeAt(i) > 0x7f ? 2 : 1;
      if (cost > limit) {
        return ret + "...";
      }
      ret += text[i];
    }

    return ret;
  };

  const clearReferences = () => {
    setReferences([]);
  };

  const removeReference = (id: string) => {
    setReferences(references.filter((r) => r.id !== id));
  };

  const displayReferences = () => {
    const displayRemoveReferenceIcon = (ref: Reference) => {
      return (
        <DeleteOutlined
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
            removeReference(ref.id);
          }}
        />
      );
    };

    const panels = references.map((ref, index) => {
      const html = md.render(ref.content);
      return (
        <Collapse.Panel
          header={ellipse(`${ref.type}: ${ref.title}`) + ` (${ref.content.length})`}
          key={"ref" + index}
          extra={displayRemoveReferenceIcon(ref)}
        >
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </Collapse.Panel>
      );
    });

    return <Collapse style={{ width: "100%" }}>{panels}</Collapse>;
  };

  const addSelectionToReference = async (): Promise<Reference | null> => {
    const selectionText = await getCurrentSelection();
    if (selectionText) {
      const selectionRef = new Reference("text", ellipse(selectionText, 20), "", selectionText);
      setReferences([...references, selectionRef]);
      return selectionRef;
    } else {
      return null;
    }
  };

  return (
    <>
      {references.length > 0 && displayReferences()}
      {references.length > 0 && <BlankDiv height={4} />}
      <Flex id="reference_actions" justify="space-between">
        <Tag>{`${references.length} ${getLocaleMessage(lang, "tag_references")}`}</Tag>
        <span>
          <Tooltip title={getLocaleMessage(lang, "tooltip_addCurrentPage")}>
            <Button
              icon={<FileAddOutlined />}
              type="text"
              size="small"
              onClick={() => addPageToReference(references, setReferences)}
            />
          </Tooltip>

          <Tooltip title={getLocaleMessage(lang, "tooltip_addSelection")}>
            <Button
              icon={<FileTextOutlined />}
              type="text"
              size="small"
              onClick={addSelectionToReference}
            />
          </Tooltip>
          <Tooltip title={getLocaleMessage(lang, "tooltip_clearReferences")}>
            <Button
              icon={<DeleteOutlined />}
              type="text"
              size="small"
              danger
              onClick={clearReferences}
            />
          </Tooltip>
        </span>
      </Flex>
    </>
  );
};
