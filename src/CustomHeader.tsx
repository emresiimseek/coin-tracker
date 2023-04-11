import { ReactNode } from "react";
import binance from "./binance.png";
import paribu from "./paribu.png";
import { Tooltip } from "@mui/material";
import { GridColumnHeaderParams } from "@mui/x-data-grid";

export const CustomHeader = (
  type: "p" | "b",
  params: GridColumnHeaderParams,
  bigger?: boolean
): ReactNode => {
  return (
    <Tooltip title={params.colDef.description}>
      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <img
          src={type === "p" ? paribu : binance}
          width={bigger ? 20 : 15}
          height={bigger ? 20 : 15}
        ></img>
        <strong>{params.colDef.headerName}</strong>
      </span>
    </Tooltip>
  );
};
