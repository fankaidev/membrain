import { Button, Tooltip } from "antd";
import { SizeType } from "antd/es/config-provider/SizeContext";
import React, { useContext } from "react";
import { LocaleContext } from "./locale_context";

export interface IconButtonProps {
  icon: React.ReactNode;
  size?: SizeType;
  tooltip?: string;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const IconButton = ({
  icon,
  onClick,
  size = "small",
  tooltip = "",
  style,
}: IconButtonProps) => {
  const { displayText } = useContext(LocaleContext)!;

  return (
    <Tooltip title={displayText(tooltip)}>
      <Button icon={icon} type="text" size={size} onClick={onClick} style={style} />
    </Tooltip>
  );
};
