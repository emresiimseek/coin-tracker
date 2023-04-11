import {
  GridColDef,
  GridColumnHeaderParams,
  GridRenderCellParams,
  GridValueFormatterParams,
} from "@mui/x-data-grid";
import { useCoinTracker } from "./hooks/useCoinTracker";
import { CustomHeader } from "./CustomHeader";
import { CombinedCoin } from "./types/Coin";
import { Button, TextField } from "@mui/material";
import { NumericFormatCustom } from "./NumericFormatCustom";
import { numericFormatter } from "react-number-format";
import { Add, Remove } from "@mui/icons-material";
import { createNewOrder } from "./binance-api";

type Params = GridRenderCellParams<CombinedCoin, any, any>;

export const GridColumns = (): GridColDef[] => {
  const { updatePrice, handleSelect, createQueryString } = useCoinTracker();

  return [
    {
      field: "symbolParibu",
      headerName: "Sembol",
      description: "Sembol",
      headerAlign: "center",
      flex: 0.5,
    },
    {
      field: "priceBinance",
      headerName: "Binance F.",
      flex: 0.5,
      type: "number",
      headerAlign: "center",
      description: "Binance Fiyat",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params),
    },

    {
      field: "paribuHighestBid",
      headerName: "Paribu S.",
      flex: 0.5,
      description: "Paribu Satış",
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "paribuLowestAsk",
      headerName: "Paribu A.",
      flex: 0.5,
      description: "Paribu Alış",
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "paribuDiff",
      headerName: "Paribu M.",
      headerAlign: "center",
      type: "number",
      flex: 0.5,
      description: "Paribu Makas",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "buyDiff",
      headerName: "AYF",
      type: "number",
      flex: 0.5,
      headerAlign: "center",
      description: "Alış Yüzde Fark",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "sellDiff",
      headerName: "SYF",
      type: "number",
      headerAlign: "center",
      flex: 0.5,
      description: "Satış Yüzde Fark",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "fixedParibuLowestAsk",
      headerName: "SPA",
      description: "Sabit Paribu Alış",
      type: "number",
      headerAlign: "center",
      flex: 0.5,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "fixedParibuHighestBid",
      headerName: "SPS",
      description: "Sabit Paribu Satış",
      type: "number",
      headerAlign: "center",
      flex: 0.5,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },

    {
      field: "fixedBinancePrice",
      headerName: "SBF",
      description: "Sabit Binance Fiyat",
      type: "number",
      headerAlign: "center",
      flex: 0.5,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params),
    },
    {
      field: "benefit",
      headerName: "Kar",
      description: "Kar",
      headerAlign: "center",
      type: "number",
      flex: 0.5,
    },
    {
      field: "paribuBuyPrice",
      headerName: "Paribu Alış Tutarı",
      description: "Paribu Alış Tutarı",
      flex: 1,
      headerAlign: "center",
      type: "action",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
      renderCell: (params: Params) => {
        return (
          <TextField
            size="small"
            value={params.row.paribuBuyPrice}
            InputProps={{
              inputComponent: NumericFormatCustom as any,
            }}
            onChange={(event) => {
              const getUnitPrice = () => {
                if (!event.target.value || !params.row.fixedParibuLowestAsk)
                  return "";

                return +event.target.value / params.row.fixedParibuLowestAsk;
              };

              updatePrice([
                {
                  ...params.row,
                  paribuBuyPrice: event.target.value,
                  unit: getUnitPrice(),
                },
              ]);
            }}
          />
        );
      },
    },
    {
      field: "paribuAmount",
      headerName: "Paribu Miktar",
      description: "Miktar",
      type: "action",
      headerAlign: "center",
      flex: 1,
      renderCell: (params: Params) => {
        return (
          <TextField
            value={params.row.paribuUnit}
            type="number"
            size="small"
            onChange={(event) => {
              const getParibuBuyPrice = () => {
                if (!event.target.value || !params.row.fixedParibuLowestAsk)
                  return "";

                return +event.target.value * params.row.fixedParibuLowestAsk;
              };
              updatePrice([
                {
                  ...params.row,
                  paribuUnit: Number(event.target.value) ?? "",
                  paribuBuyPrice: getParibuBuyPrice(),
                },
              ]);
            }}
          />
        );
      },
    },
    {
      field: "binanceAmount",
      headerName: "Binance Miktar",
      description: "Miktar",
      type: "action",
      headerAlign: "center",
      flex: 1,
      renderCell: (params: Params) => {
        return (
          <TextField
            value={params.row.binanceUnit}
            type="number"
            size="small"
            onChange={(event) => {
              updatePrice([
                {
                  ...params.row,
                  binanceUnit: Number(event.target.value) ?? "",
                },
              ]);
            }}
          />
        );
      },
    },
    {
      field: "binanceTotalPrice",
      headerName: "Binance Toplam Tutar",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params),
      type: "number",
      headerAlign: "center",
      valueFormatter: (params: GridValueFormatterParams) =>
        numericFormatter(params.value.toString(), {
          thousandSeparator: true,
          prefix: "₺",
          decimalScale: 3,
        }),
      description: "Binance Alış Tutarı",
      flex: 1,
      valueGetter: (params: Params) => {
        if (
          (!params.row.binanceUnit && !params.row.paribuBuyPrice) ||
          !params.row.fixedBinancePrice
        )
          return "";

        const quantity = params.row.binanceUnit
          ? +Number(params.row.binanceUnit).toFixed(
              params.row.quantityPrecision
            )
          : Number(params.row.paribuBuyPrice) /
              Number(params.row.fixedParibuLowestAsk) ?? 0;

        const result = quantity * Number(params.row.fixedBinancePrice ?? 0);

        return isNaN(result) ? "" : result;
      },
    },
    {
      field: "paribuBuy",
      flex: 0.5,
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params, true),
      renderCell: (params: Params) => {
        return (
          <Button
            variant="contained"
            color="success"
            startIcon={<Add />}
            onClick={() => {
              handleSelect([params.row.id], "P");
              const query = createQueryString({
                paribuBuyPrice: params.row.paribuLowestAsk.toString(),
                paribuSellPrice: params.row.paribuHighestBid.toString(),
                symbolParibu: params.row.symbolParibu,
                amount: (params.row.paribuUnit
                  ? +params.row.paribuUnit
                  : Number(params.row.paribuBuyPrice) /
                    params.row.paribuLowestAsk
                ).toFixed(6),
                type: "buy",
              });
              window.open(
                `https://www.paribu.com/markets/${params.row.symbolParibu.toLowerCase()}?${query}`
              );
            }}
          >
            Al
          </Button>
        );
      },
    },
    {
      field: "paribuSell",
      flex: 0.5,
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params, true),
      renderCell: (params: Params) => {
        return (
          <Button
            variant="contained"
            color="warning"
            startIcon={<Remove />}
            onClick={() => {
              const query = createQueryString({
                paribuBuyPrice: params.row.paribuLowestAsk.toString(),
                paribuSellPrice: params.row.paribuHighestBid.toString(),
                symbolParibu: params.row.symbolParibu,
                amount: (params.row.paribuUnit
                  ? +params.row.paribuUnit
                  : Number(params.row.paribuBuyPrice) /
                    params.row.paribuLowestAsk
                ).toFixed(1),
                type: "sell",
              });

              console.log(query);

              window.open(
                `https://www.paribu.com/markets/${params.row.symbolParibu.toLowerCase()}?${query}`
              );
            }}
          >
            Sat
          </Button>
        );
      },
    },
    {
      field: "binanceBuy",
      flex: 0.5,
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params, true),
      renderCell: (params: GridRenderCellParams<CombinedCoin>) => {
        return (
          <Button
            variant="contained"
            color="success"
            startIcon={<Add />}
            onClick={() => {
              handleSelect([params.row.id], "B");

              const quantity = +(
                params.row.binanceUnit
                  ? +Number(params.row.binanceUnit).toFixed(
                      params.row.quantityPrecision
                    )
                  : Number(params.row.paribuBuyPrice) /
                    +params.row.priceBinanceReal
              ).toFixed(params.row.quantityPrecision);

              createNewOrder({
                symbol: params.row.symbolBinance,
                side: "BUY",
                type: "LIMIT",
                quantity,
                price: params.row.priceBinanceReal.toString(),
              });
            }}
          >
            Al
          </Button>
        );
      },
    },
    {
      field: "binanceSell",
      flex: 0.5,
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params, true),
      renderCell: (params: Params) => {
        return (
          <Button
            variant="contained"
            color="warning"
            startIcon={<Remove />}
            onClick={() => {
              const quantity = +(
                params.row.binanceUnit
                  ? +Number(params.row.binanceUnit).toFixed(
                      params.row.quantityPrecision
                    )
                  : Number(params.row.paribuBuyPrice) /
                    +params.row.priceBinanceReal
              ).toFixed(params.row.quantityPrecision);

              createNewOrder({
                symbol: params.row.symbolBinance,
                side: "BUY",
                type: "LIMIT",
                quantity,
                price: params.row.priceBinanceReal.toString(),
              });
            }}
          >
            Sat
          </Button>
        );
      },
    },
  ];
};
