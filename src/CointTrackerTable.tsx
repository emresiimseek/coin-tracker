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
import {
  Button,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
} from "@mui/material";
import { NumericFormatCustom } from "./NumericFormatCustom";
import { numericFormatter } from "react-number-format";
import { createNewOrder } from "./binance-api";
import React, { forwardRef, useMemo } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import { toast } from "react-toastify";

function CoinTracker() {
  const {
    combinedArray,
    isLoading,
    items,
    selectedCoins,
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
      minWidth: 80,
      description: "Sembol",
      headerAlign: "center",
      renderCell: (params) => <strong>{params.row.symbolParibu}</strong>,
      flex: 0.6,
    },

    {
      field: "paribuHighestBid",
      headerName: "Satış Fi.",
      minWidth: 80,
      flex: 0.6,
      description: "Paribu Satış Fiyat",
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "paribuLowestAsk",
      headerName: "Alış Fi.",
      minWidth: 80,
      flex: 0.6,
      description: "Paribu Alış Fiyat",
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "paribuDiff",
      headerName: "Makas",
      minWidth: 80,
      headerAlign: "center",
      type: "number",
      flex: 0.6,
      description: "Paribu Makas",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "buyDiff",
      headerName: "Alış Fa.(%)",
      minWidth: 80,
      type: "number",
      flex: 0.8,
      headerAlign: "center",
      description: "Alış Yüzde Fark",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
    },
    {
      field: "sellDiff",
      headerName: "Satış Fa.(%)",
      minWidth: 80,
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
      minWidth: 80,
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
      minWidth: 80,
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
      minWidth: 80,
      description: "Miktar",
      headerAlign: "center",
      flex: 0.8,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
      renderCell: (params: Params) => {
        return (
          <TextField
            value={params.row.paribuUnit || ""}
            size="small"
            style={{ backgroundColor: "white", borderRadius: 5 }}
            InputProps={{
              ...AmountInput,
              style: { paddingRight: 7 },
              endAdornment: (
                <InputAdornment position="end" sx={{ marginLeft: 0 }}>
                  <IconButton
                    sx={{
                      visibility: params.row.paribuUnit || "hidden",
                      padding: 0,
                    }}
                    onClick={() => {
                      updatePrice([
                        {
                          ...params.row,
                          paribuUnit: null,
                        },
                      ]);
                    }}
                  >
                    <ClearIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
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
      minWidth: 80,
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
            value={params.row.paribuBuyPrice || ""}
            prefix="₺"
            InputProps={{
              ...PriceInput,
              style: { paddingRight: 7 },
              endAdornment: (
                <InputAdornment position="end" sx={{ marginLeft: 0 }}>
                  <IconButton
                    sx={{
                      visibility: params.row.paribuBuyPrice || "hidden",
                      padding: 0,
                    }}
                    onClick={() => {
                      updatePrice([
                        {
                          ...params.row,
                          paribuBuyPrice: null,
                        },
                      ]);
                    }}
                  >
                    <ClearIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            style={{ backgroundColor: "white", borderRadius: 5 }}
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
      headerName: "Fiyat(₺)",
      minWidth: 80,
      flex: 0.7,
      type: "number",
      headerAlign: "center",
      description: "Binance Fiyat",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params),
    },
    {
      field: "binanceRealPrice",
      headerName: "Fiyat($)",
      minWidth: 80,
      resizable: true,
      flex: 0.7,
      type: "number",
      headerAlign: "center",
      description: "Binance Fiyat",
      valueFormatter: (params) =>
        numericFormatter(params.value.toString(), { prefix: "$" }),
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params),
    },
    {
      field: "fixedBinancePrice",
      headerName: "SBF",
      minWidth: 80,
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
      minWidth: 80,
      description: "Miktar",
      type: "action",
      headerAlign: "center",
      flex: 0.8,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params),
      renderCell: (params: Params) => {
        return (
          <TextField
            value={params.row.binanceUnit || ""}
            size="small"
            style={{
              backgroundColor: "white",
              borderRadius: 5,
            }}
            InputProps={{
              style: { paddingRight: 7 },
              ...AmountInput,
              endAdornment: (
                <InputAdornment position="end" sx={{ marginLeft: 0 }}>
                  <IconButton
                    sx={{
                      visibility: params.row.binanceUnit || "hidden",
                      padding: 0,
                    }}
                    onClick={() => {
                      updatePrice([
                        {
                          ...params.row,
                          binanceUnit: null,
                        },
                      ]);
                    }}
                  >
                    <ClearIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
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
      minWidth: 80,
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
      flex: 0.8,
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
      field: "benefit",
      headerName: "Kar",
      minWidth: 80,
      description: "Kar",
      headerAlign: "center",
      type: "number",
      flex: 0.6,
    },
    {
      field: "paribuBuy",
      minWidth: 77,
      maxWidth: 77,
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params, true),
      renderCell: (params: Params) => {
        return (
          <Button
            variant="contained"
            color="success"
            sx={{
              paddingRight: 0,
              paddingLeft: 0,
            }}
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
      minWidth: 75,
      maxWidth: 75,
      headerAlign: "center",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params, true),
      renderCell: (params: Params) => {
        return (
          <Button
            variant="contained"
            sx={{
              paddingRight: 0,
              paddingLeft: 0,
            }}
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
      headerAlign: "center",
      minWidth: 75,
      maxWidth: 75,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params, true),
      renderCell: (params: GridRenderCellParams<CombinedCoin>) => {
        return (
          <Button
            variant="contained"
            size="small"
            sx={{
              paddingRight: 0,
              paddingLeft: 0,
            }}
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
            }}
          >
            Short
          </Button>
        );
      },
    },
    {
      field: "binanceSell",
      headerAlign: "center",
      minWidth: 80,
      maxWidth: 80,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params, true),
      renderCell: (params: Params) => {
        return (
          <Button
            variant="contained"
            color="warning"
            size="small"
            sx={{
              paddingRight: 0,
              paddingLeft: 0,
            }}
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
        slots={{
          loadingOverlay: LinearProgress,
          footer: Footer,
        }}
        rows={combinedArray}
        loading={isLoading}
        disableRowSelectionOnClick
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
