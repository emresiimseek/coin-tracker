import { useCallback, useEffect, useMemo, useState } from "react";
import binance from "./binance.png";
import paribu from "./paribu.png";

import axios from "axios";
import {
  DataGrid,
  GridColDef,
  GridFooterContainer,
  GridPagination,
  GridRenderCellParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { Add, Remove } from "@mui/icons-material";
import { numericFormatter } from "react-number-format";

import {
  BinanceCoins,
  ParibuRoot,
  ParibuCoin,
  CombinedCoin,
} from "./types/Coin";
import { defaultArray } from "./utils/default-array";
import { Button, TextField } from "@mui/material";
import { QueryModel } from "./types/QueryModel";
import { createNewOrder, getExchange } from "./binance-api";
import { Symbol } from "./types/ExchangeResponse";
import SettingsModal from "./SettingsModal";
import { NumericFormatCustom } from "./NumericFormatCustom";

const BINANCE_WEBSOCKET_URL = "wss://stream.binance.com/ws";
const FS_BINANCE_WEBSOCKET_URL = "wss://fstream.binance.com/ws";
const PARIBU_API_URL = "https://www.paribu.com/ticker";

function CoinTracker() {
  const [binanceCoins, setBinanceCoins] = useState<BinanceCoins[]>([]);
  const [usdttry, setUsdttry] = useState<BinanceCoins | null>(null);
  const [paribusCoins, setParibuCoins] = useState<ParibuCoin[]>([]);
  const [isMockData, setIsMockData] = useState<boolean>(false);
  const [combinedArray, setCombinedArray] = useState<CombinedCoin[]>(
    isMockData ? defaultArray() : []
  );
  const [selectedCoins, setSelectedCoins] = useState<GridRowSelectionModel>([]);
  const [symbols, setSymbol] = useState<Symbol[]>([]);

  const items = useMemo(() => symbols, [symbols]);

  const CustomHeader = (type: "p" | "b", params: any): React.ReactNode => {
    return (
      <>
        <div
          className="MuiDataGrid-columnHeaderTitle css-t89xny-MuiDataGrid-columnHeaderTitle"
          style={{ marginRight: 2 }}
        >
          {params.colDef.headerName}
        </div>
        <img
          src={type === "p" ? paribu : binance}
          width={14}
          height={14}
          alt="Flowers in Chania"
        ></img>
      </>
    );
  };

  useEffect(() => {
    // Open a new window with the URL
    if (!selectedCoins.length) return;

    const sc = selectedCoins.at(selectedCoins.length - 1);

    const currentIndex = combinedArray.findIndex((c) => c.id === sc);

    const data = { ...combinedArray[currentIndex] };

    // window.open(
    //   `https://www.paribu.com/markets/${data.symbolParibu.toLowerCase()}?view=classic`
    // );
  }, [selectedCoins]);

  function mergeArrays(
    binanceCoins: BinanceCoins[],
    paribuCoins: ParibuCoin[]
  ): CombinedCoin[] {
    if (!Array.isArray(binanceCoins) || !Array.isArray(paribuCoins)) return [];

    const mergedArray = binanceCoins.map((binanceCoin) => {
      const paribuCoin = paribuCoins.find((item) => {
        const d1 = item.symbol.split("_")[0];

        return binanceCoin.s.replace("USDT", "") === d1;
      });

      if (paribuCoin && usdttry?.c) {
        const buyDiff = Number(
          ((paribuCoin.lowestAsk - Number(binanceCoin.c) * Number(usdttry?.c)) *
            100) /
            paribuCoin.lowestAsk
        );

        const isBuy =
          ((paribuCoin.lowestAsk - Number(binanceCoin.c) * Number(usdttry?.c)) *
            100) /
            paribuCoin.lowestAsk <
          -0.1;

        const sellDiff = Number(
          ((Number(binanceCoin.c) * Number(usdttry?.c) -
            paribuCoin.highestBid) *
            100) /
            (Number(binanceCoin.c) * Number(usdttry?.c))
        );
        const data: CombinedCoin = {
          symbolBinance: binanceCoin.s,
          priceBinance: Number(binanceCoin.c) * Number(usdttry?.c),
          symbolParibu: paribuCoin.symbol,
          paribuHighestBid: paribuCoin.highestBid,
          paribuLowestAsk: paribuCoin.lowestAsk,
          id: binanceCoin.s + paribuCoin.symbol,
          priceBinanceReal: binanceCoin.c,
          buyDiff,
          isBuy,
          sellDiff,
          paribuDiff:
            ((paribuCoin.highestBid - paribuCoin.lowestAsk) /
              paribuCoin.highestBid) *
            100,
        };

        return data;
      }
    });
    return mergedArray.filter((item) => item) as CombinedCoin[];
  }

  const updatePrice = (prices: any[]) => {
    setCombinedArray((prevData) => {
      let newDataCopy = [...prevData];

      prices.forEach((newObj) => {
        const existingObj = newDataCopy.find((obj) => obj.id === newObj.id);

        if (existingObj) {
          Object.keys(newObj).forEach((key) => {
            if (newObj[key] !== undefined) {
              (existingObj as any)[key] = newObj[key];
            } else if (newObj[key] !== null) {
              (existingObj as any)[key] = null;
            }
          });

          if (!existingObj.fixedBinancePrice) {
            existingObj.benefit = null;
          } else {
            const count = existingObj.unit
              ? +existingObj.unit
              : Number(existingObj?.paribuBuyPrice ?? 0) /
                (existingObj?.fixedParibuLowestAsk ?? 0);
            const paribuProfit =
              existingObj.paribuHighestBid * count -
              (existingObj?.fixedParibuLowestAsk ?? 0) * count;
            const binanceProfit = existingObj.priceBinance * count;

            const b3 = (Number(existingObj.fixedBinancePrice) ?? 0) * count;
            const kar = paribuProfit + (binanceProfit - b3) * -1;

            existingObj.benefit = kar;
          }
        } else {
          newDataCopy.push(newObj);
        }
      });

      return [
        ...newDataCopy.filter((x) => x.isBuy),
        ...newDataCopy.filter((x) => !x.isBuy),
      ];
    });
  };
  useEffect(() => {
    if (!paribusCoins.length || !binanceCoins.length || !usdttry) return;
    const list = mergeArrays(binanceCoins, paribusCoins).filter(
      (x) => x.buyDiff > 0 || x.buyDiff < -0.1
    );

    updatePrice(list);
  }, [usdttry, paribusCoins, binanceCoins]);

  const getParibuPrice = async () => {
    const response = await axios.get<ParibuRoot>(PARIBU_API_URL);

    const bitcoinPrice = response.data;

    const dataArray = Object.entries(bitcoinPrice).map(
      ([symbol, currency]): ParibuCoin => ({
        symbol,
        ...currency,
        allData: [currency.last],
      })
    );

    setParibuCoins((prevData) => {
      const newDataCopy = [...prevData];

      dataArray.forEach((newObj) => {
        const existingObj = newDataCopy.find(
          (obj) => obj.symbol === newObj.symbol
        );
        if (existingObj) {
          Object.assign(existingObj, newObj);
          existingObj.allData = [...existingObj.allData, ...newObj.allData];
        } else {
          newDataCopy.push(newObj);
        }
      });

      return newDataCopy;
    });
  };

  const getExchangeData = async () => {
    const data = await getExchange();

    setSymbol(data as Symbol[]);
  };

  // mounted hook

  useEffect(() => {
    getExchangeData();
    function handleKeyDown(event: any) {
      if (event.ctrlKey && event.key === "a") {
        console.log("Ctrl + A was pressed");
        event.preventDefault();
        alert("Ctrl + A was pressed");
        // do something here
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    const interval = setInterval(() => {
      if (!isMockData) getParibuPrice();
    }, 1000);

    const binanceSocket = new WebSocket(BINANCE_WEBSOCKET_URL);
    binanceSocket.onopen = () => {
      console.log("WebSocket connected 2");
      const request2 = {
        method: "SUBSCRIBE",
        params: ["usdttry@ticker"],
        id: 2,
      };
      binanceSocket.send(JSON.stringify(request2));
    };

    binanceSocket.onmessage = (event) => {
      if (!event.data) return;
      const data: BinanceCoins = JSON.parse(event.data);

      if (!isMockData) setUsdttry(data);
    };

    const binanceFSSocket = new WebSocket(FS_BINANCE_WEBSOCKET_URL);

    binanceFSSocket.onopen = () => {
      console.log("WebSocket connected");
      const request = {
        method: "SUBSCRIBE",
        params: ["!miniTicker@arr"],
        id: 1,
      };
      binanceFSSocket.send(JSON.stringify(request));
    };

    binanceFSSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data) return;

      if (!isMockData) setBinanceCoins(data);
    };
    return () => {
      binanceFSSocket.close();
      binanceSocket.close();
      clearInterval(interval);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function createQueryString(params: QueryModel) {
    let queryString = "";
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        queryString += `&${key}=${params[key]}`;
      }
    }
    // Remove the first '&' character
    queryString = queryString.slice(1);
    return `?${queryString}`;
  }

  const columns: GridColDef[] = [
    {
      field: "symbolParibu",
      headerName: "Sembol",
      description: "Sembol",
      flex: 0.5,
    },
    {
      field: "priceBinance",
      headerName: "Binance F.",
      flex: 0.5,
      type: "number",
      description: "Binance Fiyat",
      renderHeader: (params) => CustomHeader("p", params),
    },

    {
      field: "paribuHighestBid",
      headerName: "Paribu S.",
      flex: 0.5,
      description: "Paribu Satış",
      renderHeader: (params) => CustomHeader("p", params),
    },
    {
      field: "paribuLowestAsk",
      headerName: "Paribu A.",
      flex: 0.5,
      description: "Paribu Alış",
      renderHeader: (params) => CustomHeader("p", params),
    },
    {
      field: "paribuDiff",
      headerName: "Paribu M.",
      type: "number",
      flex: 0.5,
      description: "Paribu Makas",
      renderHeader: (params) => CustomHeader("p", params),
    },
    {
      field: "buyDiff",
      headerName: "AYF",
      type: "number",
      flex: 0.5,
      description: "Alış Yüzde Fark",
      renderHeader: (params) => CustomHeader("p", params),
    },
    {
      field: "sellDiff",
      headerName: "SYF",
      type: "number",
      flex: 0.5,
      description: "Satış Yüzde Fark",
      renderHeader: (params) => CustomHeader("p", params),
    },
    {
      field: "fixedParibuLowestAsk",
      headerName: "SPA",
      description: "Sabit Paribu Alış",
      type: "number",
      flex: 0.5,
      renderHeader: (params) => CustomHeader("p", params),
    },
    {
      field: "fixedParibuHighestBid",
      headerName: "SPS",
      description: "Sabit Paribu Satış",
      type: "number",
      flex: 0.5,
      renderHeader: (params) => CustomHeader("p", params),
    },

    {
      field: "fixedBinancePrice",
      headerName: "SBF",
      description: "Sabit Binance Fiyat",
      type: "number",
      flex: 0.5,
      renderHeader: (params) => CustomHeader("b", params),
    },
    {
      field: "benefit",
      headerName: "Kar",
      description: "Kar",
      type: "number",
      flex: 0.5,
    },
    {
      field: "paribuBuyPrice",
      headerName: "Paribu Alış Tutarı",
      description: "Paribu Alış Tutarı",
      flex: 1,
      type: "action",
      renderHeader: (params) => CustomHeader("p", params),
      renderCell: (params: GridRenderCellParams<CombinedCoin>) => {
        return (
          <TextField
            value={params.row.paribuBuyPrice}
            InputProps={{
              inputComponent: NumericFormatCustom as any,
            }}
            disabled={!params.row.fixedParibuLowestAsk}
            onChange={(event) => {
              updatePrice([
                {
                  ...params.row,
                  paribuBuyPrice: event.target.value,
                  unit: "",
                },
              ]);
            }}
          />
        );
      },
    },
    {
      field: "amount",
      headerName: "Manuel Miktar",
      description: "Miktar",
      type: "action",
      flex: 1,
      valueGetter: (params) => {},
      renderCell: (params) => {
        return (
          <TextField
            disabled={!params.row.fixedParibuLowestAsk}
            value={params.row.unit}
            type="number"
            onChange={(event) => {
              updatePrice([
                {
                  ...params.row,
                  unit: event.target.value,
                  paribuBuyPrice: "",
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
      renderHeader: (params) => CustomHeader("b", params),
      type: "number",
      valueFormatter: (params) =>
        numericFormatter(params.value.toString(), {
          thousandSeparator: true,
          prefix: "₺",
          decimalScale: 3,
        }),
      description: "Binance Toplam Tutar",
      flex: 1,
      valueGetter: (params: GridRenderCellParams<CombinedCoin>) => {
        if (!params.row?.unit && !params.row.paribuBuyPrice) return "";

        const quantity = params.row.unit
          ? +params.row.unit
          : Number(params.row.paribuBuyPrice) /
              Number(params.row.fixedParibuLowestAsk) ?? 0;

        return quantity * Number(params.row.fixedBinancePrice ?? 0);
      },
    },
    {
      field: "paribuBuy",
      headerName: "Paribu Al",
      renderHeader: (params) => CustomHeader("p", params),
      renderCell: (params: GridRenderCellParams<CombinedCoin>) => {
        return (
          <Button
            variant="contained"
            color="success"
            startIcon={<Add />}
            onClick={() => {
              const query = createQueryString({
                paribuBuyPrice: params.row.paribuLowestAsk.toString(),
                paribuSellPrice: params.row.paribuHighestBid.toString(),
                symbolParibu: params.row.symbolParibu,
                amount: (params.row.unit
                  ? +params.row.unit
                  : Number(params.row.paribuBuyPrice) /
                    params.row.paribuLowestAsk
                ).toFixed(1),
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
      headerName: "Paribu Sat",
      renderHeader: (params) => CustomHeader("p", params),
      renderCell: (params: GridRenderCellParams<CombinedCoin>) => {
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
                amount: (params.row.unit
                  ? +params.row.unit
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
      headerName: "Binance Al",
      renderHeader: (params) => CustomHeader("b", params),
      renderCell: (params: GridRenderCellParams<CombinedCoin>) => {
        return (
          <Button
            variant="contained"
            color="success"
            startIcon={<Add />}
            onClick={() => {
              const symbol = symbols.find(
                (ei) => ei.symbol === params.row.symbolBinance
              );
              createNewOrder({
                symbol: params.row.symbolBinance,
                side: "BUY",
                type: "LIMIT",
                quantity: +(
                  params.row.unit
                    ? +params.row.unit
                    : Number(params.row.paribuBuyPrice) /
                      +params.row.priceBinanceReal
                ).toFixed(symbol?.quantityPrecision),
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
      headerName: "Binance Sat",
      renderHeader: (params) => CustomHeader("b", params),
      renderCell: (params: GridRenderCellParams<CombinedCoin>) => {
        return (
          <Button
            variant="contained"
            color="warning"
            startIcon={<Remove />}
            onClick={() => {
              const symbol = symbols.find(
                (ei) => ei.symbol === params.row.symbolBinance
              );

              createNewOrder({
                symbol: params.row.symbolBinance,
                side: "BUY",
                type: "LIMIT",
                quantity: +(
                  params.row.unit
                    ? +params.row.unit
                    : Number(params.row.paribuBuyPrice) /
                      +params.row.priceBinanceReal
                ).toFixed(symbol?.quantityPrecision),
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

  const handleSelect = useCallback(
    (newRowSelectionModel: GridRowSelectionModel) => {
      selectedCoins.concat(newRowSelectionModel).forEach((nr) => {
        const currentIndex = combinedArray.findIndex((c) => c.id === nr);

        const data = { ...combinedArray[currentIndex] };

        if (selectedCoins.includes(nr) && !newRowSelectionModel.includes(nr)) {
          combinedArray[currentIndex].fixedParibuHighestBid = null;
          combinedArray[currentIndex].fixedParibuLowestAsk = null;
          combinedArray[currentIndex].fixedBinancePrice = null;
        } else {
          combinedArray[currentIndex].fixedParibuHighestBid =
            data.paribuHighestBid;
          combinedArray[currentIndex].fixedParibuLowestAsk =
            data.paribuLowestAsk;
          combinedArray[currentIndex].fixedBinancePrice = data.priceBinance;
        }

        updatePrice([combinedArray[currentIndex]]);
      });

      setSelectedCoins(newRowSelectionModel);
    },
    [combinedArray, selectedCoins]
  );

  return (
    <div
      key={combinedArray.length || selectedCoins.length}
      style={{ maxWidth: "100vw", height: "100vh", padding: 10 }}
    >
      <DataGrid
        rows={combinedArray}
        disableRowSelectionOnClick
        components={{
          Footer: () => (
            <GridFooterContainer>
              <SettingsModal symbols={items} />
              <GridPagination style={{ flex: 1 }} />
            </GridFooterContainer>
          ),
        }}
        columns={columns}
        density="standard"
        style={{ height: "98vh" }}
        checkboxSelection
        rowSelectionModel={selectedCoins}
        onRowSelectionModelChange={handleSelect}
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
