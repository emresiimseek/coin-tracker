import {
  DataGrid,
  GridColDef,
  GridColumnHeaderParams,
  GridFooterContainer,
  GridPagination,
  GridRenderCellParams,
  GridValueFormatterParams,
} from "@mui/x-data-grid";
import { LoadingButton } from "@mui/lab";
import SettingsModal from "./SettingsModal";
import { useCoinTracker } from "./hooks/useCoinTracker";
import { CustomHeader } from "./CustomHeader";
import { CombinedCoin, Params } from "./types/Coin";
import { Button, TextField } from "@mui/material";
import { NumericFormatCustom } from "./NumericFormatCustom";
import { numericFormatter } from "react-number-format";
import { createNewOrder } from "./binance-api";
import React, { forwardRef, useMemo } from "react";
import { toast } from "react-toastify";

function CoinTracker() {
  const {
    combinedArray,
    isLoading,
    items,
    selectedCoins,
    setSelectedCoins,
    handleSelect,
    createQueryString,
    updatePrice,
    loading,
    setLoading,
  } = useCoinTracker();

  const columns: GridColDef[] = [
    {
      field: "symbolParibu",
      headerName: "Sembol",
      description: "Sembol",
      headerAlign: "center",
      flex: 0.6,
    },
    {
      field: "benefit",
      headerName: "Kar",
      description: "Kar",
      headerAlign: "center",
      type: "number",
      flex: 0.6,
    },
    {
      field: "paribuHighestBid",
      headerName: "Satış F.",
      flex: 0.6,
      description: "Paribu Satış Fiyat",
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "paribuLowestAsk",
      headerName: "Alış F.",
      flex: 0.6,
      description: "Paribu Alış Fiyat",
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "paribuDiff",
      headerName: "Makas",
      headerAlign: "center",
      type: "number",
      flex: 0.5,
      description: "Paribu Makas",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "buyDiff",
      headerName: "Alış Fark(%)",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
      description: "Alış Yüzde Fark",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "sellDiff",
      headerName: "Satış Fark(%)",
      type: "number",
      headerAlign: "center",
      flex: 0.8,
      description: "Satış Yüzde Fark",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "fixedParibuLowestAsk",
      headerName: "SPA",
      description: "Sabit Alış F.",
      type: "number",
      headerAlign: "center",
      flex: 0.5,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "fixedParibuHighestBid",
      headerName: "SPS",
      description: "Sabit Satış F.",
      type: "number",
      headerAlign: "center",
      flex: 0.5,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },

    {
      field: "paribuAmount",
      headerName: "Miktar",
      description: "Miktar",
      type: "action",
      headerAlign: "center",
      flex: 0.8,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
      renderCell: (params: Params) => {
        return (
          <TextField
            value={params.row.paribuUnit}
            size="small"
            InputProps={AmountInput}
            onChange={(event) => {
              const getParibuBuyPrice = () => {
                if (!event.target.value || !params.row.fixedParibuLowestAsk)
                  return null;

                return +event.target.value * params.row.fixedParibuLowestAsk;
              };
              updatePrice([
                {
                  ...params.row,
                  paribuUnit: +event.target.value,
                  paribuBuyPrice: getParibuBuyPrice(),
                },
              ]);
            }}
          />
        );
      },
    },
    {
      field: "paribuBuyPrice",
      headerName: "Toplam (₺)",
      description: "Paribu Toplam",
      flex: 0.8,
      headerAlign: "center",
      type: "action",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
      renderCell: (params: Params) => {
        return (
          <TextField
            size="small"
            value={params.row.paribuBuyPrice}
            prefix="₺"
            InputProps={PriceInput}
            onChange={(event) => {
              updatePrice([
                {
                  ...params.row,
                  paribuBuyPrice: +event.target.value,
                },
              ]);
            }}
          />
        );
      },
    },

    {
      field: "priceBinance",
      headerName: "Fiyat",
      flex: 0.6,
      type: "number",
      headerAlign: "center",
      description: "Binance Fiyat",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params),
    },
    {
      field: "fixedBinancePrice",
      headerName: "SBF",
      description: "Sabit Fiyat",
      type: "number",
      headerAlign: "center",
      flex: 0.6,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params),
    },
    {
      field: "binanceAmount",
      headerName: "Miktar",
      description: "Miktar",
      type: "action",
      headerAlign: "center",
      flex: 0.8,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params),
      renderCell: (params: Params) => {
        return (
          <TextField
            value={params.row.binanceUnit}
            size="small"
            InputProps={AmountInput}
            onChange={(event) => {
              const getBinanceBuyPrice = () => {
                if (!event.target.value || !params.row.fixedBinancePrice)
                  return null;

                return +event.target.value * params.row.fixedBinancePrice;
              };
              updatePrice([
                {
                  ...params.row,
                  binanceUnit: +event.target.value,
                  binanceBuyPrice: getBinanceBuyPrice(),
                },
              ]);
            }}
          />
        );
      },
    },
    {
      field: "binanceTotalPrice",
      headerName: "Toplam(₺)",
      hideSortIcons: true,
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
      flex: 0.7,
      valueGetter: (params: Params) => {
        if (!params.row.binanceUnit && !params.row.fixedBinancePrice) return "";

        const quantity = +Number(params.row.binanceUnit).toFixed(
          params.row.quantityPrecision
        );

        const price = params.row?.fixedBinancePrice
          ? params.row?.fixedBinancePrice
          : params.row.priceBinance;

        const result = (quantity * Number(price)) / 3;

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
            size="small"
            onClick={() => {
              if (!params.row.paribuUnit && !params.row.paribuBuyPrice) {
                toast("Toplam tutar giriniz!", {
                  type: "info",
                  position: "top-center",
                  autoClose: 1000,
                });
                return;
              }

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
      flex: 0.6,
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params, true),
      renderCell: (params: Params) => {
        return (
          <Button
            variant="contained"
            color="warning"
            size="small"
            onClick={() => {
              if (!params.row.paribuUnit && !params.row.paribuBuyPrice) {
                toast("Toplam tutar giriniz!", {
                  type: "info",
                  position: "top-center",
                  autoClose: 1000,
                });
                return;
              }

              const query = createQueryString({
                paribuBuyPrice: params.row.paribuLowestAsk.toString(),
                paribuSellPrice: params.row.paribuHighestBid.toString(),
                symbolParibu: params.row.symbolParibu,
                amount: (params.row.paribuUnit
                  ? +params.row.paribuUnit
                  : Number(params.row.paribuBuyPrice) /
                    params.row.paribuLowestAsk
                ).toFixed(6),
                type: "sell",
              });

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
      flex: 0.6,
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params, true),
      renderCell: (params: GridRenderCellParams<CombinedCoin>) => {
        return (
          <LoadingButton
            loading={loading}
            variant="contained"
            size="small"
            color="success"
            onClick={() => {
              if (!params.row.binanceUnit) {
                toast("Miktar giriniz!", {
                  type: "info",
                  position: "top-center",
                  autoClose: 1000,
                });
                return;
              }

              setLoading(true);

              handleSelect([params.row.id], "B");

              const quantity = +(
                params.row.binanceUnit
                  ? +Number(params.row.binanceUnit).toFixed(
                      params.row.quantityPrecision
                    )
                  : Number(params.row.binanceBuyPrice) /
                    Number(params.row.fixedBinanceRealPrice)
              ).toFixed(params.row.quantityPrecision);

              createNewOrder({
                symbol: params.row.symbolBinance,
                side: "SELL",
                type: "LIMIT",
                quantity,
                price: params.row?.fixedBinanceRealPrice?.toString(),
                positionSide: "BOTH",
              });

              setLoading(false);
            }}
          >
            Short
          </LoadingButton>
        );
      },
    },
    {
      field: "binanceSell",
      flex: 0.6,
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params, true),
      renderCell: (params: Params) => {
        return (
          <Button
            variant="contained"
            color="warning"
            size="small"
            onClick={async () => {
              handleSelect([params.row.id], "B");

              const quantity = +(
                params.row.binanceUnit
                  ? +Number(params.row.binanceUnit).toFixed(
                      params.row.quantityPrecision
                    )
                  : Number(params.row.paribuBuyPrice) /
                    Number(params.row?.fixedBinanceRealPrice)
              ).toFixed(params.row.quantityPrecision);

              await createNewOrder({
                symbol: params.row.symbolBinance,
                side: "BUY",
                type: "LIMIT",
                quantity,
                price: params.row?.fixedBinanceRealPrice?.toString(),
                positionSide: "BOTH",
              });

              // setSelectedCoins(selectedCoins.filter((c) => c != params.row.id));

              // updatePrice([
              //   {
              //     ...params.row,
              //     fixedBinancePrice: null,
              //     fixedBinanceRealPrice: null,
              //     fixedParibuHighestBid: null,
              //     fixedParibuLowestAsk: null,
              //     paribuBuyPrice: null,
              //     binanceBuyPrice: null,
              //   },
              // ]);
            }}
          >
            Long
          </Button>
        );
      },
    },
  ];

  const Footer = useMemo(
    () => () =>
      (
        <GridFooterContainer>
          <SettingsModal symbols={items} />
          <GridPagination style={{ flex: 1 }} />
        </GridFooterContainer>
      ),

    [items]
  );

  const NumericFormat = forwardRef((props: any, ref) => {
    const { prefix = "" } = props;
    return <NumericFormatCustom {...props} prefix={prefix} refs={ref} />;
  });

  const PriceInput = useMemo(
    () => ({
      inputComponent: (props: any) => <NumericFormat {...props} prefix="₺" />,
    }),
    []
  );

  const AmountInput = useMemo(
    () => ({
      inputComponent: (props: any) => <NumericFormat {...props} />,
    }),
    []
  );

  return (
    <div
      key={combinedArray.length || selectedCoins.length}
      style={{ maxWidth: "100vw", height: "100vh" }}
    >
      <DataGrid
        rows={combinedArray}
        loading={isLoading}
        disableRowSelectionOnClick
        components={{
          Footer,
        }}
        columns={columns}
        density="standard"
        style={{
          height: "100vh",
          backgroundColor: "#f9f9f9",
        }}
        checkboxSelection
        rowSelectionModel={selectedCoins}
        onRowSelectionModelChange={(rowSelectionModel) =>
          handleSelect(rowSelectionModel, "BP")
        }
        getRowClassName={(value) => {
          if (value.row.isBuy) return "buy";
          else if (
            Math.sign(value.row.sellDiff) === -1 &&
            Math.sign(value.row.buyDiff) === 1 &&
            value.row.benefit
          )
            return "sell";
          else return "";
        }}
      />
    </div>
  );
}

export default CoinTracker;
