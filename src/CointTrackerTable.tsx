import {
  DataGrid,
  GridColDef,
  GridColumnHeaderParams,
  GridFooterContainer,
  GridPagination,
  GridRenderCellParams,
  GridValueFormatterParams,
} from "@mui/x-data-grid";
import SettingsModal from "./SettingsModal";
import { useCoinTracker } from "./hooks/useCoinTracker";
import { CustomHeader } from "./CustomHeader";
import { CombinedCoin, Params } from "./types/Coin";
import NotificationSound from "./notification-sound.mp3";

import {
  Button,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
} from "@mui/material";
import { NumericFormatCustom } from "./NumericFormatCustom";
import { numericFormatter } from "react-number-format";
import { btcSumbitOrder, createNewOrder } from "./binance-api";
import React, { forwardRef, useMemo } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import { toast } from "react-toastify";
import YesNoDialog from "./YesNoDialog";

function CoinTracker() {
  const {
    combinedArray,
    items,
    selectedCoins,
    handleSelect,
    createQueryString,
    updatePrice,
    audioPlayer,
    dialogOpen,
    setDialogOpen,
    sellList,
    setSellList,
    setSelectedCoins,
    alignment,
    setAlignment,
    columnVisibilityModel,
    isParibu,
  } = useCoinTracker();

  const columns: GridColDef[] = [
    {
      field: "symbolParibu",
      headerName: "Sembol",
      minWidth: 80,
      description: "Sembol",
      headerAlign: "center",
      renderCell: (params) => <strong>{params.row.symbolBinance}</strong>,
      flex: 0.6,
    },
    {
      field: "btcBid",
      headerName: "Satış F.",
      minWidth: 80,
      type: "number",
      headerAlign: "center",
      flex: 0.8,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("bt", params),
    },
    {
      field: "btcAsk",
      headerName: "Alış F.",
      minWidth: 80,
      type: "number",
      headerAlign: "center",
      flex: 0.8,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("bt", params),
    },
    {
      field: "fixedBtcBid",
      headerName: "Satış F.",
      minWidth: 80,
      type: "number",
      headerAlign: "center",
      flex: 0.8,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("bt", params),
    },
    {
      field: "fixedBtcAsk",
      headerName: "Alış F.",
      minWidth: 80,
      type: "number",
      headerAlign: "center",
      flex: 0.8,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("bt", params),
    },
    {
      field: "btcTotal",
      headerName: "Toplam(₺)",
      minWidth: 80,
      description: "BTC Toplam",
      flex: 1,
      headerAlign: "center",
      type: "action",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("bt", params),
      renderCell: (params: Params) => {
        return (
          <TextField
            size="small"
            autoComplete="off"
            value={params.row.btcTotal || ""}
            placeholder="₺"
            InputProps={{
              inputComponent: NumericFormatCustom as any,
              style: { paddingRight: 7 },
              endAdornment: (
                <InputAdornment position="end" sx={{ marginLeft: 0 }}>
                  <IconButton
                    sx={{
                      visibility: params.row.btcTotal || "hidden",
                      padding: 0,
                    }}
                    onClick={() => {
                      updatePrice([
                        {
                          ...params.row,
                          btcTotal: null,
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
                  btcTotal: +event.target.value,
                  btcUnit:
                    +event.target.value /
                    Number(params.row.fixedBtcAsk ?? params.row.btcAsk),
                },
              ]);
            }}
          />
        );
      },
    },
    {
      field: "btcUnit",
      headerName: "Miktar",
      minWidth: 80,
      description: "Miktar",
      headerAlign: "center",
      flex: 1,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("bt", params),
      renderCell: (params: Params) => {
        return (
          <TextField
            value={params.row.btcUnit || ""}
            autoComplete="off"
            size="small"
            style={{ backgroundColor: "white", borderRadius: 5 }}
            InputProps={{
              inputComponent: NumericFormatCustom as any,
              style: { paddingRight: 7 },
              endAdornment: (
                <InputAdornment position="end" sx={{ marginLeft: 0 }}>
                  <IconButton
                    sx={{
                      visibility: params.row.btcUnit || "hidden",
                      padding: 0,
                    }}
                    onClick={() => {
                      updatePrice([
                        {
                          ...params.row,
                          btcUnit: null,
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
              const getBTCTotal = () => {
                if (!event.target.value || !params.row.fixedBtcA) return null;

                return +event.target.value * Number(params.row.fixedBtcAsk);
              };
              updatePrice([
                {
                  ...params.row,
                  btcUnit: +event.target.value,
                  btcTotal: getBTCTotal(),
                },
              ]);
            }}
          />
        );
      },
    },
    {
      field: "paribuHighestBid",
      headerName: "Sat. Fi.",
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
      field: "paribuTotal",
      headerName: "Toplam (₺)",
      minWidth: 80,
      description: "Paribu Toplam",
      flex: 1,
      headerAlign: "center",
      type: "action",
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
      renderCell: (params: Params) => {
        return (
          <TextField
            size="small"
            autoComplete="off"
            value={params.row.paribuTotal || ""}
            placeholder="₺"
            InputProps={{
              inputComponent: NumericFormatCustom as any,
              style: { paddingRight: 7 },
              endAdornment: (
                <InputAdornment position="end" sx={{ marginLeft: 0 }}>
                  <IconButton
                    sx={{
                      visibility: params.row.paribuTotal || "hidden",
                      padding: 0,
                    }}
                    onClick={() => {
                      updatePrice([
                        {
                          ...params.row,
                          paribuTotal: null,
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
                  paribuTotal: +event.target.value,
                  paribuUnit:
                    +event.target.value /
                    Number(
                      params.row.fixedParibuLowestAsk ??
                        params.row.paribuLowestAsk
                    ),
                },
              ]);
            }}
          />
        );
      },
    },
    {
      field: "paribuAmount",
      headerName: "Miktar",
      minWidth: 80,
      description: "Miktar",
      headerAlign: "center",
      flex: 1,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("p", params),
      renderCell: (params: Params) => {
        return (
          <TextField
            value={params.row.paribuUnit || ""}
            autoComplete="off"
            size="small"
            style={{ backgroundColor: "white", borderRadius: 5 }}
            InputProps={{
              inputComponent: NumericFormatCustom as any,
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
              const getParibuTotal = () => {
                if (!event.target.value || !params.row.fixedParibuLowestAsk)
                  return null;

                return +event.target.value * params.row.fixedParibuLowestAsk;
              };
              updatePrice([
                {
                  ...params.row,
                  paribuUnit: +event.target.value,
                  paribuTotal: getParibuTotal(),
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
      flex: 1,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params),
      renderCell: (params: Params) => {
        return (
          <TextField
            value={params.row.binanceUnit || ""}
            autoComplete="off"
            size="small"
            style={{
              backgroundColor: "white",
              borderRadius: 5,
            }}
            InputProps={{
              style: { paddingRight: 7 },
              inputComponent: NumericFormatCustom as any,
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
              const getbinanceTotal = () => {
                if (!event.target.value || !params.row.fixedBinancePrice)
                  return null;

                return +event.target.value * params.row.fixedBinancePrice;
              };
              updatePrice([
                {
                  ...params.row,
                  binanceUnit: +event.target.value,
                  binanceTotal: getbinanceTotal(),
                },
              ]);
            }}
          />
        );
      },
    },
    {
      field: "binanceTotalPrice",
      headerName: `Toplam${isParibu ? "(₺)" : "($)"}`,
      hideSortIcons: true,
      minWidth: 80,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("b", params),
      headerAlign: "center",
      valueFormatter: (params: GridValueFormatterParams) => {
        const data = params.value + "" || "";

        return numericFormatter(data, {
          thousandSeparator: true,
          prefix: "₺",
          decimalScale: 3,
          valueIsNumericString: true,
        });
      },
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

        return isNaN(result) || !params.row.binanceUnit ? "" : result;
      },
    },
    {
      field: "benefitParibu",
      headerName: "P. Kar",
      type: "number",
      minWidth: 80,
      description: "Kar",
      headerAlign: "center",
      flex: 0.6,
      valueGetter: (params: Params) => {
        const commissionP = 2.5 / 1000;

        const count = params.row.paribuUnit
          ? params.row.paribuUnit
          : Number(params.row.paribuTotal) /
            Number(params.row.fixedParibuLowestAsk);

        const paribuProfit =
          Number(params.row.paribuHighestBid) * count -
          (params.row?.fixedParibuLowestAsk ?? 0) * count;

        const commissionParibu =
          commissionP * Number(params.row.paribuTotal) +
          commissionP * (Number(params.row.paribuTotal) + paribuProfit);

        const commissionB = 0.2 / 1000;

        const binanceProfit =
          Number(params.row.fixedBinancePrice) *
            +Number(params.row.binanceUnit).toFixed(
              params.row.quantityPrecision
            ) -
          params.row.priceBinance *
            +Number(params.row.binanceUnit).toFixed(
              params.row.quantityPrecision
            );

        const commissionBinance =
          commissionB * Number(params.row.binanceTotal) +
          commissionB * (Number(params.row.binanceTotal) + binanceProfit);

        const totalCommisson = commissionBinance + commissionParibu;

        const lastBenefit = Number(params.row.benefit);

        const result = paribuProfit + binanceProfit - totalCommisson;

        return isNaN(lastBenefit) || lastBenefit === 0 ? "" : result;
      },
    },
    {
      field: "benefitBTC",
      headerName: "BTC Kar",
      type: "number",
      minWidth: 80,
      description: "Kar",
      headerAlign: "center",
      flex: 0.6,
      valueGetter: (params: Params) => {
        const commissionBTCRate = 1 / 1000;

        const count = params.row.btcUnit
          ? params.row.btcUnit
          : Number(params.row.btcTotal) / Number(params.row.fixedBtcAsk);

        const btcProfit =
          Number(params.row.btcBid) * count -
          (params.row?.fixedBtcAsk ?? 0) * count;

        const commissionBTC =
          commissionBTCRate * Number(params.row.btcTotal) +
          commissionBTCRate * (Number(params.row.btcTotal) + btcProfit);

        const commissionB = 0.2 / 1000;

        const binanceProfit =
          Number(params.row.fixedBinancePrice) *
            +Number(params.row.binanceUnit).toFixed(
              params.row.quantityPrecision
            ) -
          params.row.priceBinance *
            +Number(params.row.binanceUnit).toFixed(
              params.row.quantityPrecision
            );

        const commissionBinance =
          commissionB * Number(params.row.binanceTotal) +
          commissionB * (Number(params.row.binanceTotal) + binanceProfit);

        const totalCommisson = commissionBinance + commissionBTC;

        const lastBenefit = Number(params.row.benefitBTC);
        const result = btcProfit + binanceProfit - totalCommisson;

        return isNaN(lastBenefit) || lastBenefit === 0 ? "" : result;
      },
    },

    {
      field: "scissors",
      headerName: "Makas",
      minWidth: 80,
      headerAlign: "center",
      type: "number",
      flex: 0.6,
      description: "Makas",
    },
    {
      field: "buyDiff",
      headerName: "Alış Fa.(%)",
      minWidth: 80,
      type: "number",
      flex: 0.8,
      headerAlign: "center",
      description: "Alış Yüzde Fark",
    },
    {
      field: "sellDiff",
      headerName: "Sat. Fa.(%)",
      minWidth: 80,
      type: "number",
      headerAlign: "center",
      flex: 0.8,
      description: "Satış Yüzde Fark",
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
              if (!params.row.paribuUnit && !params.row.paribuTotal) {
                toast("Toplam tutar giriniz!", {
                  type: "info",
                  position: "top-center",
                  autoClose: 1000,
                });
                return;
              }

              handleSelect([params.row.id], "P");

              const query = createQueryString({
                paribuBuyPrice: params.row?.paribuLowestAsk?.toString(),
                paribuSellPrice: params.row?.paribuHighestBid?.toString(),
                symbolParibu: params.row.symbolParibu,
                amount: (params.row.paribuUnit
                  ? +params.row.paribuUnit
                  : Number(params.row.paribuTotal) /
                    Number(params.row.paribuLowestAsk)
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
              if (!params.row.paribuUnit && !params.row.paribuTotal) {
                toast("Toplam tutar giriniz!", {
                  type: "info",
                  position: "top-center",
                  autoClose: 1000,
                });
                return;
              }

              const query = createQueryString({
                paribuBuyPrice: params.row?.paribuLowestAsk?.toString(),
                paribuSellPrice: params.row?.paribuHighestBid?.toString(),
                symbolParibu: params.row.symbolParibu,
                amount: (params.row.paribuUnit
                  ? +params.row.paribuUnit
                  : Number(params.row.paribuTotal) /
                    Number(params.row.paribuLowestAsk)
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

              const quantity = (
                params.row.binanceUnit * params.row.binanceRealPrice
              ).toFixed(params.row.quantityPrecision);

              createNewOrder({
                symbol: params.row.symbolBinance,
                side: "SELL",
                type: "LIMIT",
                quantity,
                price: params.row.binanceRealPrice.toFixed(
                  params.row.quantityPrecision
                ),
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
              if (!params.row.binanceUnit) {
                toast("Miktar giriniz!", {
                  type: "info",
                  position: "top-center",
                  autoClose: 1000,
                });
                return;
              }
              const quantity = (
                Number(params.row.binanceUnit) * params.row.binanceRealPrice
              ).toFixed(params.row.quantityPrecision);

              await createNewOrder({
                symbol: params.row.symbolBinance,
                side: "BUY",
                type: "LIMIT",
                quantity,
                price: params.row?.binanceRealPrice?.toFixed(
                  params.row.pricePrecision
                ),
                positionSide: "BOTH",
              });
              handleSelect([], "BP");
            }}
          >
            Long
          </Button>
        );
      },
    },
    {
      field: "btcBuy",
      headerAlign: "center",
      minWidth: 75,
      maxWidth: 75,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("bt", params, true),
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
            onClick={async () => {
              if (!params.row.btcUnit) {
                toast("Miktar giriniz!", {
                  type: "info",
                  position: "top-center",
                  autoClose: 1000,
                });
                return;
              }

              btcSumbitOrder({
                orderType: "buy",
                quantity: params.row.btcUnit.toString() ?? "",
                pairSymbol: params.row.btcSymbol?.toString() ?? "",
                price: params.row.btcBid?.toString() ?? "",
              });

              handleSelect([], "BTC");
            }}
          >
            Short
          </Button>
        );
      },
    },
    {
      field: "btcSell",
      headerAlign: "center",
      minWidth: 80,
      maxWidth: 80,
      renderHeader: (params: GridColumnHeaderParams) =>
        CustomHeader("bt", params, true),
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
              if (!params.row.btcUnit) {
                toast("Miktar giriniz!", {
                  type: "info",
                  position: "top-center",
                  autoClose: 1000,
                });
                return;
              }

              btcSumbitOrder({
                orderType: "buy",
                quantity: params.row.btcUnit.toString() ?? "",
                pairSymbol: params.row.btcSymbol?.toString() ?? "",
                price: params.row.btcAsk?.toString() ?? "",
              });

              handleSelect([], "BTC");
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
          <SettingsModal
            symbols={items}
            alignment={alignment}
            onChange={(alignment) => setAlignment(alignment)}
          />
          <GridPagination style={{ flex: 1 }} />
        </GridFooterContainer>
      ),

    [items, alignment]
  );

  return (
    <div
      key={combinedArray.length || selectedCoins.length}
      style={{ maxWidth: "100vw", height: "100vh" }}
    >
      <audio ref={audioPlayer} src={NotificationSound} />
      <YesNoDialog
        title="Alınabilir tüm coinleri şeçmek istediğinizden emin misiniz?"
        open={dialogOpen}
        onClose={(result) => {
          setDialogOpen(false);

          if (result) {
            const allIds = combinedArray
              .filter((item) => item.isBuy)
              .map((item) => item.id);

            handleSelect(allIds, "BP");
            setSelectedCoins(allIds);
          }
        }}
      />
      <DataGrid
        slots={{
          loadingOverlay: LinearProgress,
          footer: Footer,
        }}
        rows={combinedArray}
        disableRowSelectionOnClick
        columns={columns}
        columnVisibilityModel={columnVisibilityModel}
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
          const { isBuy, sellDiff, buyDiff, id, benefit, benefitBTC } =
            value.row;

          const isSell =
            (Math.sign(sellDiff) === -1 &&
              Math.sign(buyDiff) === 1 &&
              benefit) ||
            (Math.sign(sellDiff) === -1 &&
              Math.sign(buyDiff) === 1 &&
              benefitBTC);

          let tradeType = "";

          if (isBuy) {
            if (sellList.includes(id)) {
              setSellList((prev) => prev.filter((id) => id !== id));
            }
            tradeType = "buy";
          } else if (isSell) {
            if (!sellList.includes(id)) {
              setSellList((prev) => [...prev, id]);

              if (audioPlayer.current) audioPlayer.current.play();
            }
            tradeType = "sell";
          } else {
            if (sellList.includes(id)) {
              setSellList((prev) => prev.filter((id) => id !== id));
            }
          }

          return tradeType;
        }}
      />
    </div>
  );
}

export default CoinTracker;
