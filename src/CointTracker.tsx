import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataGrid, GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import {
  BinanceCoins,
  ParibuRoot,
  ParibuCoin,
  CombinedCoin,
} from "./types/Coin";

const BINANCE_WEBSOCKET_URL = "wss://stream.binance.com/ws";
const FS_BINANCE_WEBSOCKET_URL = "wss://fstream.binance.com/ws";
const PARIBU_API_URL = "https://www.paribu.com/ticker";

function CoinTracker() {
  const [binanceCoins, setBinanceCoins] = useState<BinanceCoins[]>([]);
  const [usdttry, setUsdttry] = useState<BinanceCoins | null>(null);
  const [paribusCoins, setParibuCoins] = useState<ParibuCoin[]>([]);
  const [combinedArray, setCombinedArray] = useState<CombinedCoin[]>([]);
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
        const data: CombinedCoin = {
          symbolBinance: binanceCoin.s,
          priceBinance: Number(binanceCoin.c) * Number(usdttry?.c),
          symbolParibu: paribuCoin.symbol,
          paribuHighestBid: paribuCoin.highestBid,
          paribuLowestAsk: paribuCoin.lowestAsk,
          id: binanceCoin.s + paribuCoin.symbol,
          isBuy:
            ((paribuCoin.lowestAsk -
              Number(binanceCoin.c) * Number(usdttry?.c)) *
              100) /
              paribuCoin.lowestAsk <
            -0.1,
          buyDiff: Number(
            (
              ((paribuCoin.lowestAsk -
                Number(binanceCoin.c) * Number(usdttry?.c)) *
                100) /
              paribuCoin.lowestAsk
            ).toFixed(3)
          ),
          sellDiff: Number(
            (
              ((Number(binanceCoin.c) * Number(usdttry?.c) -
                paribuCoin.lowestAsk) *
                100) /
              (Number(binanceCoin.c) * Number(usdttry?.c))
            ).toFixed(3)
          ),
        };

        return data;
      }
    });
    return mergedArray.filter((item) => item) as CombinedCoin[];
  }

  const updatePrice = (prices: any[]) => {
    console.log(prices);

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

      console.log(newDataCopy);

      return newDataCopy;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      getParibuPrice();
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

      setUsdttry(data);
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

      setBinanceCoins(data);
    };
    return () => {
      binanceFSSocket.close();
      binanceSocket.close();
      clearInterval(interval);
    };
  }, []);

  const handleChange = useCallback(
    (value: number) => {
      setPrincipal(value.toString());
    },
    [principal]
  );

  const columns: GridColDef[] = [
    { field: "symbolBinance", headerName: "Binance Sembol", flex: 1 },
    {
      field: "priceBinance",
      headerName: "Binance Fiyat",
      flex: 1,
      type: "number",
    },
    { field: "symbolParibu", headerName: "Paribu Sembol", flex: 1 },
    {
      field: "paribuHighestBid",
      headerName: "Paribu Satış",
      flex: 1,
      type: "number",
    },
    {
      field: "paribuLowestAsk",
      headerName: "Paribu Alış",
      flex: 1,
      type: "number",
    },
    {
      field: "buyDiff",
      headerName: "Alış Yüzde Fark",
      flex: 1,
      type: "number",
    },
    {
      field: "sellDiff",
      headerName: "Satış Yüzde Fark",
      flex: 1,
      type: "number",
    },
    { field: "isBuy", headerName: "Satın Al", flex: 1, type: "boolean" },
    {
      field: "fixedParibuLowestAsk",
      headerName: "Sabit Paribu Alış",
      flex: 1,
      type: "number",
    },
    {
      field: "fixedParibuHighestBid",
      headerName: "Sabit Paribu Satış",
      flex: 1,
      type: "number",
    },
    {
      field: "fixedBinancePrice",
      headerName: "Sabit Binance Fiyat",
      flex: 1,
      type: "number",
    },
    { field: "benefit", headerName: "Kar", flex: 1, type: "number" },
  ];

  return (
    <div
      key={combinedArray.length || selectedCoins.length}
      style={{ maxWidth: "100%", height: "100vh" }}
    >
      <DataGrid
        rows={combinedArray}
        columns={columns}
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
        sx={{
          ".MuiDataGrid-row": {
            "&:hover": {
              backgroundColor: "hsl(120, 76%, 59%)",
            },
          },
          ".MuiDataGrid-row.Mui-selected": {
            backgroundColor: "none",
            "&:hover": {
              backgroundColor: "#3a9fbf",
            },
          },
        }}
      />
    </div>
  );
}

export default CoinTracker;
