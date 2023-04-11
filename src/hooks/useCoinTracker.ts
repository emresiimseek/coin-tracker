import {
  BinanceCoins,
  CombinedCoin,
  ParibuCoin,
  ParibuRoot,
} from "@/types/Coin";
import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultArray } from "../utils/default-array";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import { Symbol } from "@/types/ExchangeResponse";
import axios from "axios";
import { getExchange } from "../binance-api";
import { QueryModel } from "@/types/QueryModel";
import { GridColumns } from "../GridColumns";

const BINANCE_WEBSOCKET_URL = "wss://stream.binance.com/ws";
const FS_BINANCE_WEBSOCKET_URL = "wss://fstream.binance.com/ws";
const PARIBU_API_URL = "https://www.paribu.com/ticker";

export const useCoinTracker = () => {
  const [binanceCoins, setBinanceCoins] = useState<BinanceCoins[]>([]);
  const [usdttry, setUsdttry] = useState<BinanceCoins | null>(null);
  const [paribusCoins, setParibuCoins] = useState<ParibuCoin[]>([]);
  const [isMockData, setIsMockData] = useState<boolean>(true);
  const [combinedArray, setCombinedArray] = useState<CombinedCoin[]>(
    isMockData ? defaultArray() : []
  );
  const [selectedCoins, setSelectedCoins] = useState<GridRowSelectionModel>([]);
  const [symbols, setSymbol] = useState<Symbol[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const items = useMemo(() => symbols, [symbols]);

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

      const symbol = symbols.find((s) => s.symbol === binanceCoin.s);

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
          priceBinanceReal: +binanceCoin.c,
          buyDiff,
          isBuy,
          sellDiff,
          paribuDiff:
            ((paribuCoin.highestBid - paribuCoin.lowestAsk) /
              paribuCoin.highestBid) *
            100,
          quantityPrecision: symbol?.quantityPrecision,
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
            const paribuCount = existingObj.paribuUnit
              ? +existingObj.paribuUnit
              : Number(existingObj?.paribuBuyPrice ?? 0) /
                (existingObj?.fixedParibuLowestAsk ?? 0);

            const paribuProfit =
              existingObj.paribuHighestBid * paribuCount -
              (existingObj?.fixedParibuLowestAsk ?? 0) * paribuCount;

            const binanceProfit =
              existingObj.fixedBinancePrice *
                +paribuCount.toFixed(existingObj.quantityPrecision) -
              existingObj.priceBinance *
                +paribuCount.toFixed(existingObj.quantityPrecision);

            const profit = paribuProfit + binanceProfit;

            existingObj.benefit = Number.isNaN(profit) ? null : profit;
          }

          setIsLoading(false);
        } else {
          newDataCopy.push(newObj);
          setIsLoading(true);
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

  const handleSelect = useCallback(
    (newRowSelectionModel: GridRowSelectionModel, type: "B" | "P" | "BP") => {
      selectedCoins.concat(newRowSelectionModel).forEach((nr) => {
        const currentIndex = combinedArray.findIndex((c) => c.id === nr);

        const data = { ...combinedArray[currentIndex] };

        if (selectedCoins.includes(nr) && !newRowSelectionModel.includes(nr)) {
          combinedArray[currentIndex].fixedParibuHighestBid = null;
          combinedArray[currentIndex].fixedParibuLowestAsk = null;
          combinedArray[currentIndex].fixedBinancePrice = null;
          combinedArray[currentIndex].paribuBuyPrice = 0;
        } else {
          if (type === "P") {
            combinedArray[currentIndex].fixedParibuHighestBid =
              data.paribuHighestBid;
            combinedArray[currentIndex].fixedParibuLowestAsk =
              data.paribuLowestAsk;

            const unit = (
              data.paribuUnit
                ? +data.paribuUnit
                : Number(data.paribuBuyPrice) / Number(data.paribuLowestAsk)
            ).toFixed(6);

            combinedArray[currentIndex].paribuBuyPrice =
              +unit * Number(data.paribuLowestAsk);

            combinedArray[currentIndex].paribuUnit = +unit;
          } else if (type === "B") {
            combinedArray[currentIndex].fixedBinancePrice = data.priceBinance;

            const unit = (
              data.binanceUnit
                ? +Number(data.binanceUnit).toFixed(data.quantityPrecision)
                : Number(data.paribuBuyPrice) / Number(data.paribuLowestAsk)
            ).toFixed(6);

            combinedArray[currentIndex].binanceUnit =
              Number(data.paribuBuyPrice) / Number(unit);
          }

          if (type === "BP") {
            combinedArray[currentIndex].fixedParibuHighestBid =
              data.paribuHighestBid;
            combinedArray[currentIndex].fixedParibuLowestAsk =
              data.paribuLowestAsk;

            const binanceUnit = data.binanceUnit
              ? +Number(data.binanceUnit).toFixed(data?.quantityPrecision)
              : Number(data.paribuBuyPrice) / Number(data.paribuLowestAsk);

            combinedArray[currentIndex].paribuBuyPrice =
              binanceUnit * Number(data.paribuLowestAsk);

            combinedArray[currentIndex].fixedBinancePrice = data.priceBinance;
          }
        }

        updatePrice([combinedArray[currentIndex]]);
      });

      setSelectedCoins(newRowSelectionModel);
    },
    [combinedArray, selectedCoins]
  );

  const columns = useMemo(() => GridColumns, []);

  return {
    updatePrice,
    createQueryString,
    setSelectedCoins,
    handleSelect,
    columns,
    isLoading,
    items,
    selectedCoins,
    combinedArray,
  };
};
