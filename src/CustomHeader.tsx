import { ReactNode, useMemo } from "react";
import binance from "./binance.png";
import paribu from "./paribu.png";
import btc from "./btc.png";
import { Tooltip } from "@mui/material";
import { GridColumnHeaderParams } from "@mui/x-data-grid";

export const CustomHeader = (
  type: "p" | "b" | "bt",
  params: GridColumnHeaderParams,
  bigger?: boolean
): ReactNode => {
  const src = useMemo(
    () => (type === "p" ? paribu : type === "b" ? binance : btc),
    [type]
  );

  return (
    <Tooltip title={params.colDef.description}>
      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <img src={src} width={bigger ? 20 : 15} height={bigger ? 20 : 15}></img>
        <strong>{params.colDef.headerName}</strong>
      </span>
    </Tooltip>
  );
};
