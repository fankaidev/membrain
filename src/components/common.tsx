import React from "react";

export const BlankDiv = ({ height }: { height?: number }) => {
  return <div style={{ height: `${height || 8}px`, margin: "0px", padding: "0px" }}></div>;
};
