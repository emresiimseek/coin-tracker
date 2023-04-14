import {
  BinanceCoins,
  CombinedCoin,
  ParibuCoin,
  ParibuRoot,
} from "@/types/Coin";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defaultArray } from "../utils/default-array";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import { Symbol } from "@/types/ExchangeResponse";
import axios from "axios";
import { getExchange } from "../binance-api";
import { QueryModel } from "@/types/QueryModel";

const BINANCE_WEBSOCKET_URL = "wss://stream.binance.com/ws";
const FS_BINANCE_WEBSOCKET_URL = "wss://fstream.binance.com/ws";
const PARIBU_API_URL = "https://www.paribu.com/ticker";

export const useCoinTracker = () => {
  const [binanceCoins, setBinanceCoins] = useState<BinanceCoins[]>([]);
  const [usdttry, setUsdttry] = useState<BinanceCoins | null>(null);
  const [paribusCoins, setParibuCoins] = useState<ParibuCoin[]>([]);
  const [isMockData, setIsMockData] = useState<boolean>(false);
  const [combinedArray, setCombinedArray] = useState<CombinedCoin[]>(
    isMockData ? defaultArray() : []
  );
  const [selectedCoins, setSelectedCoins] = useState<GridRowSelectionModel>([]);
  const [symbols, setSymbol] = useState<Symbol[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>();
  const [loading, setLoading] = useState(false);
  const items = useMemo(() => symbols, [symbols]);

  const audioPlayer = useRef<HTMLAudioElement>(null);

  function mergeArrays(
    binanceCoins: BinanceCoins[],
    paribuCoins: ParibuCoin[]
  ): CombinedCoin[] {
    if (!Array.isArray(binanceCoins) || !Array.isArray(paribuCoins)) {
      return [];
    }

    const mergedArray: CombinedCoin[] = [];

    binanceCoins.forEach((binanceCoin) => {
      const d1 = binanceCoin.s.replace("USDT", "");

      const paribuCoin = paribuCoins.find(
        (item) => item.symbol.split("_")[0] === d1
      );

      if (paribuCoin && usdttry?.c) {
        const binancePrice = Number(binanceCoin.c);
        const paribuLowestAsk = paribuCoin.lowestAsk;
        const paribuHighestBid = paribuCoin.highestBid;
        const isBuy =
          ((paribuLowestAsk - binancePrice * Number(usdttry?.c)) * 100) /
            paribuLowestAsk <
          -0.1;
        const buyDiff = Number(
          ((paribuLowestAsk - binancePrice * Number(usdttry?.c)) /
            paribuLowestAsk) *
            100
        );
        const sellDiff = Number(
          ((binancePrice * Number(usdttry?.c) - paribuHighestBid) /
            (binancePrice * Number(usdttry?.c))) *
            100
        );

        const symbol = symbols.find((s) => s.symbol === binanceCoin.s);
        const quantityPrecision = symbol?.quantityPrecision;

        const data: CombinedCoin = {
          symbolBinance: binanceCoin.s,
          priceBinance: +(binancePrice * Number(usdttry?.c)).toFixed(
            symbol?.pricePrecision
          ),
          symbolParibu: paribuCoin.symbol,
          paribuHighestBid,
          paribuLowestAsk,
          id: binanceCoin.s + paribuCoin.symbol,
          binanceRealPrice: binancePrice,
          buyDiff,
          isBuy,
          sellDiff,
          paribuDiff:
            ((paribuHighestBid - paribuLowestAsk) / paribuHighestBid) * 100,
          quantityPrecision,
          pricePrecision: symbol?.pricePrecision,
        };

        mergedArray.push(data);
      }
    });

    return mergedArray;
  }

  const updatePrice = (prices: CombinedCoin[]) => {
    setCombinedArray((prevData) => {
      const newDataCopy = prevData.map((obj) => ({ ...obj }));

      prices.forEach((newObj) => {
        const existingIndex = newDataCopy.findIndex(
          (obj) => obj.id === newObj.id
        );

        if (existingIndex !== -1) {
          const existingObj = newDataCopy[existingIndex];

          Object.entries(newObj).forEach(([key, value]) => {
            if (value !== undefined) {
              existingObj[key] = value;
            } else if (value !== null) {
              existingObj[key] = null;
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

          if (isLoading === true) setIsLoading(false);
        } else {
          newDataCopy.push(newObj);
          setIsLoading(true);
        }
      });

      const selectedCoinsSet = new Set(selectedCoins);
      const allCoins = [
        ...newDataCopy.filter((x) => selectedCoinsSet.has(x.id)),
        ...newDataCopy.filter((x) => x.isBuy && !selectedCoinsSet.has(x.id)),
        ...newDataCopy.filter((x) => !x.isBuy && !selectedCoinsSet.has(x.id)),
      ];

      sessionStorage.setItem("coins", JSON.stringify(allCoins));

      return allCoins;
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
    if (isMockData) return;

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

  const handleBeforeUnload = (ev: any) => {
    ev.preventDefault();

    const confirmationMessage = "Are you sure you want to exit?";

    ev.returnValue = "Are you sure you want to exit?";

    return confirmationMessage;
  };

  // mounted hook
  useEffect(() => {
    getExchangeData();

    const coins = sessionStorage.getItem("coins");

    if (coins) {
      let coinsData = JSON.parse(coins) as CombinedCoin[];

      coinsData = coinsData.map((c) => ({
        ...c,
        fixedBinancePrice: null,
        fixedBinanceRealPrice: null,
        fixedParibuHighestBid: null,
        fixedParibuLowestAsk: null,
        paribuBuyPrice: null,
        binanceBuyPrice: null,
        isBuy: false,
      }));

      if (coinsData.length) setCombinedArray(coinsData);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    const interval = setInterval(getParibuPrice, 1000);

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
      window.removeEventListener("beforeunload", handleBeforeUnload);
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
      if (newRowSelectionModel.length > selectedCoins.length + 1) return;

      const updatedCoins = selectedCoins
        .concat(newRowSelectionModel)
        .map((nr) => {
          const currentIndex = combinedArray.findIndex((c) => c.id === nr);

          const data = { ...combinedArray[currentIndex] };
          let updatedCoin = { ...combinedArray[currentIndex] };

          const setBinance = () => {
            updatedCoin.fixedBinancePrice = data.priceBinance;
            updatedCoin.fixedBinanceRealPrice = data.binanceRealPrice;
          };

          const setParibu = () => {
            updatedCoin.fixedParibuHighestBid = data.paribuHighestBid;
            updatedCoin.fixedParibuLowestAsk = data.paribuLowestAsk;

            const unit = data.paribuUnit
              ? +data.paribuUnit
              : Number(data.paribuBuyPrice) / Number(data.paribuLowestAsk);

            updatedCoin.paribuBuyPrice = +unit * Number(data.paribuLowestAsk);
          };

          if (
            selectedCoins.includes(nr) &&
            !newRowSelectionModel.includes(nr)
          ) {
            updatedCoin.fixedParibuHighestBid = null;
            updatedCoin.fixedParibuLowestAsk = null;
            updatedCoin.fixedBinancePrice = null;
            updatedCoin.paribuBuyPrice = null;
            updatedCoin.binanceBuyPrice = null;
            updatedCoin.fixedBinanceRealPrice = null;
          } else {
            if (type === "P") setParibu();
            else if (type === "B") setBinance();
            else if (type === "BP") {
              setBinance();
              setParibu();
            }
          }

          return updatedCoin;
        });

      updatePrice(updatedCoins);
      setSelectedCoins(newRowSelectionModel);
    },
    [combinedArray, selectedCoins, updatePrice]
  );

  return {
    updatePrice,
    createQueryString,
    setSelectedCoins,
    handleSelect,
    setLoading,
    isLoading,
    items,
    selectedCoins,
    combinedArray,
    loading,
    audioPlayer,
  };
};
