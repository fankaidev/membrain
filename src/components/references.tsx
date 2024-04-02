import {
  ChromeOutlined,
  DeleteOutlined,
  FileAddOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Collapse, Flex, Tag } from "antd";
import markdownit from "markdown-it";
import React, { useContext, useEffect } from "react";
import { getFromStorage, saveToStorage } from "../hooks/useStorage";
import { useChatReferenceStore } from "../logic/reference_store";
import { TXT } from "../utils/locale";
import { Reference } from "../utils/message";
import { BlankDiv } from "./common";
import { IconButton } from "./icon_button";
import { LocaleContext } from "./locale_context";

export const ReferenceBox = ({}: {}) => {
  const { references, addPageRef, addSelectionRef, removeReference, clearReferences } =
    useChatReferenceStore();

  useEffect(() => {
    getFromStorage("local", "references", []).then((references) => {
      useChatReferenceStore.setState({ references });
    });
  }, []);

  useChatReferenceStore(() => {
    useEffect(() => {
      console.log("update refs");
      saveToStorage("local", "references", references);
    }, [references]);
  });

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

    const items = references.map((ref, index) => {
      const html = md.render(ref.content);
      return {
        key: "ref" + index,
        label: (
          <>
            {ref.type == "webpage" ? <ChromeOutlined /> : <FileTextOutlined />}
            {ellipse(` ${ref.title}`) + ` (${ref.content.length})`}
          </>
        ),
        children: (
          <div>
            <a target="_blank" href={ref.url}>
              {ref.url}
            </a>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ),
        extra: displayRemoveReferenceIcon(ref),
      };
    });

    return <Collapse style={{ width: "100%" }} items={items} />;
  };

  const { displayText } = useContext(LocaleContext)!;

  return (
    <>
      {references.length > 0 && displayReferences()}
      {references.length > 0 && <BlankDiv height={4} />}
      <Flex id="reference_actions" justify="space-between">
        <Tag>{`${references.length} ${displayText(TXT.LABEL_REFERENCES)}`}</Tag>
        <span>
          <IconButton
            icon={<FileAddOutlined />}
            onClick={() => addPageRef()}
            tooltip={TXT.ACTION_REF_ADD_PAGE}
          />
          <IconButton
            icon={<FileTextOutlined />}
            onClick={addSelectionRef}
            tooltip={TXT.ACTION_REF_ADD_SELECTION}
          />
          <IconButton
            icon={<DeleteOutlined />}
            onClick={clearReferences}
            tooltip={TXT.ACTION_REF_CLEAR}
          />
        </span>
      </Flex>
    </>
  );
};
