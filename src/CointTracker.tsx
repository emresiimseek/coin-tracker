import { useEffect, useState } from "react";
import axios from "axios";
import { DataGrid, GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";

import {
  BinanceCoins,
  ParibuRoot,
  ParibuCoin,
  CombinedCoin,
} from "./types/Coin";
import { defaultArray } from "./defaultArray";
import { TextField, Tooltip } from "@mui/material";

const BINANCE_WEBSOCKET_URL = "wss://stream.binance.com/ws";
const FS_BINANCE_WEBSOCKET_URL = "wss://fstream.binance.com/ws";
const PARIBU_API_URL = "https://www.paribu.com/ticker";

function CoinTracker() {
  const [binanceCoins, setBinanceCoins] = useState<BinanceCoins[]>([]);
  const [usdttry, setUsdttry] = useState<BinanceCoins | null>(null);
  const [paribusCoins, setParibuCoins] = useState<ParibuCoin[]>([]);
  const [isMockData, setIsMockData] = useState<boolean>(false);
  const [combinedArray, setCombinedArray] = useState<CombinedCoin[]>(
    isMockData ? defaultArray : []
  );
  const [selectedCoins, setSelectedCoins] = useState<GridRowSelectionModel>([]);
  const [principal, setPrincipal] = useState<string>("1000");

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
          (
            ((paribuCoin.lowestAsk -
              Number(binanceCoin.c) * Number(usdttry?.c)) *
              100) /
            paribuCoin.lowestAsk
          ).toFixed(3)
        );

        const isBuy =
          ((paribuCoin.lowestAsk - Number(binanceCoin.c) * Number(usdttry?.c)) *
            100) /
            paribuCoin.lowestAsk <
          -0.1;

        const sellDiff = Number(
          (
            ((Number(binanceCoin.c) * Number(usdttry?.c) -
              paribuCoin.highestBid) *
              100) /
            (Number(binanceCoin.c) * Number(usdttry?.c))
          ).toFixed(3)
        );
        const data: CombinedCoin = {
          symbolBinance: binanceCoin.s,
          priceBinance: Number(binanceCoin.c) * Number(usdttry?.c),
          symbolParibu: paribuCoin.symbol,
          paribuHighestBid: paribuCoin.highestBid,
          paribuLowestAsk: paribuCoin.lowestAsk,
          id: binanceCoin.s + paribuCoin.symbol,
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

          if (existingObj.fixedBinancePrice == null) {
            existingObj.benefit = null;
          } else {
            const count = +principal / (existingObj?.fixedParibuLowestAsk ?? 0);
            const paribuProfit =
              existingObj.paribuHighestBid * count -
              (existingObj?.fixedParibuLowestAsk ?? 0) * count;
            const binanceProfit = existingObj.priceBinance * count;

            const b3 = (+existingObj.fixedBinancePrice ?? 0) * count;
            const kar = paribuProfit + (binanceProfit - b3) * -1;

            existingObj.benefit = kar;
          }
        } else {
          newDataCopy.push(newObj);
        }
      });

      const data1 = [
        ...newDataCopy.filter((x) => x.isBuy),
        ...newDataCopy.filter((x) => !x.isBuy),
      ];

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

  useEffect(() => {
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
    };
  }, []);

  const columns: GridColDef[] = [
    {
      field: "symbolBinance",
      headerName: "Binance",
      flex: 1,
      description: "Binance Sembol",
    },
    {
      field: "priceBinance",
      headerName: "Binance F.",
      flex: 1,
      type: "number",
      description: "Binance Fiyat",
    },
    {
      field: "symbolParibu",
      headerName: "Paribu",
      description: "Paribu Sembol",
      flex: 1,
    },
    {
      field: "paribuHighestBid",
      headerName: "Paribu S.",
      flex: 1,
      type: "number",
      description: "Paribu Satış",
    },
    {
      field: "paribuLowestAsk",
      headerName: "Paribu A.",
      flex: 1,
      type: "number",
      description: "Paribu Alış",
    },

    {
      field: "paribuDiff",
      headerName: "Paribu M.",
      flex: 1,
      type: "number",
      description: "Paribu Makas",
    },
    {
      field: "buyDiff",
      headerName: "AYF",
      flex: 1,
      type: "number",
      description: "Alış Yüzde Fark",
    },
    {
      field: "sellDiff",
      headerName: "SYF",
      flex: 1,
      type: "number",
      description: "Satış Yüzde Fark",
    },

    {
      field: "isBuy",
      headerName: "Satın Al",
      flex: 1,
      type: "boolean",
      description: "Satın Al,",
    },
    {
      field: "fixedParibuLowestAsk",
      headerName: "SPA",
      type: "number",
      description: "Sabit Paribu Alış",
    },
    {
      field: "fixedParibuHighestBid",
      headerName: "SPS",
      type: "number",
      description: "Sabit Paribu Satış",
    },

    {
      field: "fixedBinancePrice",
      headerName: "SBF",
      type: "number",
      description: "Sabit Binance Fiyat",
    },
    {
      field: "benefit",
      headerName: "Kar",
      type: "number",
      description: "Kar",
    },
  ];

  return (
    <div
      key={combinedArray.length || selectedCoins.length}
      style={{ maxWidth: "100vw", height: "100vh", padding: 10 }}
    >
      <div style={{ display: "flex", marginBottom: 5 }}>
        <TextField
          id="outlined-basic"
          label="Ana Para"
          variant="outlined"
          type="number"
          value={principal}
          onChange={(event) => setPrincipal(event.target.value)}
          size="small"
        />
      </div>

      <DataGrid
        rows={combinedArray}
        columns={columns}
        style={{ height: "93vh" }}
        checkboxSelection
        rowSelectionModel={selectedCoins}
        onRowSelectionModelChange={(newRowSelectionModel) => {
          selectedCoins.concat(newRowSelectionModel).forEach((nr) => {
            const currentIndex = combinedArray.findIndex((c) => c.id === nr);

            const data = { ...combinedArray[currentIndex] };

            if (
              selectedCoins.includes(nr) &&
              !newRowSelectionModel.includes(nr)
            ) {
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
        }}
        getRowClassName={(value) => {
          return value.row.isBuy ? "buy" : "";
        }}
      />
    </div>
  );
}

export default CoinTracker;
