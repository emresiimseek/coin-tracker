import { ReactNode } from "react";
import binance from "./binance.png";
import paribu from "./paribu.png";

export const CustomHeader = (
  type: "p" | "b",
  params: any,
  bigger?: boolean
): ReactNode => {
  return (
    <>
      <img
        src={type === "p" ? paribu : binance}
        width={bigger ? 20 : 15}
        height={bigger ? 20 : 15}
      ></img>
      <div
        className="MuiDataGrid-columnHeaderTitle"
        style={{ marginLeft: 3, fontWeight: 500 }}
      >
        {params.colDef.headerName}
      </div>
    </>
  );
};
