import { Button, Tooltip } from "antd";
import { SizeType } from "antd/es/config-provider/SizeContext";
import React from "react";
import { useAppState } from "../logic/app_state";

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
  const { displayText } = useAppState();

  return (
    <Tooltip title={displayText(tooltip)}>
      <Button icon={icon} type="text" size={size} onClick={onClick} style={style} />
    </Tooltip>
  );
};
