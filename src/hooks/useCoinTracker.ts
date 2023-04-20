import {
  BTCCoin,
  BTCTickerData,
  BinanceCoins,
  CombinedCoin,
  ParibuCoin,
  ParibuRoot,
} from "@/types/Coin";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CryptoES from "crypto-es";

import { defaultArray } from "../utils/default-array";
import {
  GridColumnVisibilityModel,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { Symbol } from "@/types/ExchangeResponse";
import axios from "axios";
import { getExchange, getTicker } from "../binance-api";
import { QueryModel } from "@/types/QueryModel";

const BINANCE_WEBSOCKET_URL = "wss://stream.binance.com/ws";
const FS_BINANCE_WEBSOCKET_URL = "wss://fstream.binance.com/ws";
const PARIBU_API_URL = "https://www.paribu.com/ticker";
const BTC_API_URL = "https://api.btcturk.com/api/v2/ticker";

export const useCoinTracker = () => {
  const [isMockData, setIsMockData] = useState<boolean>(false);
  const [combinedArray, setCombinedArray] = useState<CombinedCoin[]>(
    isMockData ? defaultArray() : []
  );
  const [binanceCoins, setBinanceCoins] = useState<BinanceCoins[]>([]);
  const [usdttry, setUsdttry] = useState<BinanceCoins | null>(null);
  const [paribusCoins, setParibuCoins] = useState<ParibuCoin[]>([]);
  const [selectedCoins, setSelectedCoins] = useState<GridRowSelectionModel>([]);
  const [symbols, setSymbol] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(false);
  const items = useMemo(() => symbols, [symbols]);
  const audioPlayer = useRef<HTMLAudioElement>(null);
  const [sellList, setSellList] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [btcCoins, setBtcCoins] = useState<BTCTickerData[]>([]);
  const [alignment, setAlignment] = useState<"binance-paribu" | "binance-btc">(
    "binance-paribu"
  );

  function mergeArrays(
    binanceCoins: BinanceCoins[],
    paribuCoins?: ParibuCoin[],
    btcCoins?: BTCTickerData[]
  ): CombinedCoin[] {
    if (
      (!Array.isArray(binanceCoins) && !Array.isArray(paribuCoins)) ||
      (!Array.isArray(binanceCoins) && !Array.isArray(btcCoins))
    ) {
      return [];
    }

    const mergedArray: CombinedCoin[] = [];

    binanceCoins.forEach((binanceCoin) => {
      const d1 = binanceCoin.s.replace("USDT", "");

      const paribuCoin = paribuCoins?.find(
        (item) => item.symbol.split("_")[0] === d1
      );

      const btcCoin = btcCoins?.find((item) => item.NS == d1);

      const condition = isParibu ? !!paribuCoin : !!btcCoin;

      if (condition && usdttry?.c) {
        const binancePrice = Number(binanceCoin.c) * Number(usdttry.c);
        const ask =
          alignment === "binance-paribu"
            ? paribuCoin?.lowestAsk ?? 0
            : Number(btcCoin?.A) ?? 0;
        const bid =
          alignment === "binance-paribu"
            ? paribuCoin?.highestBid ?? 0
            : Number(btcCoin?.B) ?? 0;

        const isBuy = ((ask - binancePrice) * 100) / ask < -0.1;

        const buyDiff = Number(((ask - binancePrice) / ask) * 100);
        const sellDiff = Number(((binancePrice - bid) / binancePrice) * 100);

        const symbol = symbols.find((s) => s.symbol === binanceCoin.s);
        const quantityPrecision = symbol?.quantityPrecision;

        const data: CombinedCoin = {
          symbolBinance: binanceCoin.s,
          priceBinance: +binancePrice.toFixed(symbol?.pricePrecision),
          symbolParibu: paribuCoin?.symbol,
          paribuHighestBid: paribuCoin?.highestBid,
          paribuLowestAsk: paribuCoin?.lowestAsk,
          id: binanceCoin.s,
          binanceRealPrice: Number(binanceCoin.c),
          buyDiff,
          isBuy,
          sellDiff,
          scissors: ((bid - ask) / bid) * 100,
          quantityPrecision,
          pricePrecision: symbol?.pricePrecision,
          btcAsk: btcCoin?.A,
          btcBid: btcCoin?.B,
          btcSymbol: btcCoin?.PS,
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
          } else if (!existingObj.fixedBtcAsk || !existingObj.fixedBtcBid) {
            existingObj.benefitBTC = null;
          } else {
            const paribuCount = existingObj.paribuUnit
              ? +existingObj.paribuUnit
              : Number(existingObj?.paribuTotal ?? 0) /
                (existingObj?.fixedParibuLowestAsk ?? 0);

            const paribuProfit =
              Number(existingObj.paribuHighestBid) * paribuCount -
              (existingObj?.fixedParibuLowestAsk ?? 0) * paribuCount;

            const binanceProfit =
              existingObj.fixedBinancePrice *
                +Number(existingObj.binanceUnit).toFixed(
                  existingObj.quantityPrecision
                ) -
              existingObj.priceBinance *
                +Number(existingObj.binanceUnit).toFixed(
                  existingObj.quantityPrecision
                );

            const profit = paribuProfit + binanceProfit;

            existingObj.benefit =
              Number.isNaN(profit) ||
              !existingObj.binanceUnit ||
              !existingObj.paribuUnit
                ? null
                : profit;

            // -----------------

            const btcCount = existingObj.btcUnit
              ? +existingObj.btcUnit
              : Number(existingObj?.btcTotal ?? 0) /
                (existingObj?.fixedParibuLowestAsk ?? 0);

            const btcProfit =
              Number(existingObj.paribuHighestBid) * btcCount -
              (existingObj?.fixedParibuLowestAsk ?? 0) * btcCount;

            const profitBTC = btcProfit + binanceProfit;

            existingObj.benefitBTC =
              Number.isNaN(profitBTC) ||
              !existingObj.binanceUnit ||
              !existingObj.btcUnit
                ? null
                : profitBTC;
          }
        } else {
          newDataCopy.push(newObj);
        }
      });

      const selectedCoinsSet = new Set(selectedCoins);
      const allCoins = [
        ...newDataCopy.filter((x) => selectedCoinsSet.has(x.id)),
        ...newDataCopy.filter((x) => x.isBuy && !selectedCoinsSet.has(x.id)),
        ...newDataCopy.filter((x) => !x.isBuy && !selectedCoinsSet.has(x.id)),
      ];

      isParibu
        ? sessionStorage.setItem("paribuCoins", JSON.stringify(allCoins))
        : sessionStorage.setItem("btcCoins", JSON.stringify(allCoins));

      return allCoins;
    });
  };

  useEffect(() => {
    if (!binanceCoins.length || !usdttry) return;

    if (!paribusCoins.length && !btcCoins?.length) return;

    const list = mergeArrays(binanceCoins, paribusCoins, btcCoins).filter(
      (x) => x.buyDiff > 0 || x.buyDiff < -0.1
    );

    updatePrice(list);
  }, [usdttry, paribusCoins, binanceCoins, btcCoins]);

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

  function getBTCTicker() {
    const url = "wss://ws-feed-pro.btcturk.com/";
    const connection = new WebSocket(url);

    const publicKey = "634e4535-5d7a-41a7-9676-5d7b79e7fab0";
    const privateKey = "voUO/rYdhEiHILyl/FJ+5NNTv5CTXGWG";

    const nonce = 3000;
    const stamp = new Date().getTime();

    const baseString = `${publicKey}${nonce}`;
    const signature = CryptoES.HmacSHA256(baseString, privateKey).toString(
      CryptoES.enc.Base64
    );

    const message = `[151,{"type":151,"channel":"ticker","event":"all","join":true}]`;

    connection.onopen = () => {
      connection.send(message);
    };

    connection.onerror = (error) => {
      console.log(`WebSocket error: ${error}`);
    };

    connection.onmessage = (e) => {
      const btcData = JSON.parse(e.data);
      const items = btcData.at(btcData.length - 1).items;
      setBtcCoins(items);
    };
    return connection;
  }

  function setStroageData() {
    getExchangeData();

    const coins = isParibu
      ? sessionStorage.getItem("paribuCoins")
      : sessionStorage.getItem("btcCoins");

    if (coins) {
      setSelectedCoins([]);
      let coinsData = JSON.parse(coins) as CombinedCoin[];

      coinsData = coinsData.map((c) => ({
        ...c,
        fixedBinancePrice: null,
        fixedBinanceRealPrice: null,
        fixedParibuHighestBid: null,
        fixedParibuLowestAsk: null,
        paribuTotal: null,
        binanceTotal: null,
        paribuUnit: null,
        binanceUnit: null,
        benefit: null,
      }));

      if (coinsData.length) setCombinedArray(coinsData);
    }
  }

  const mounted = () => {
    setStroageData();

    window.addEventListener("beforeunload", handleBeforeUnload);

    let interval: any;
    let connection: any;

    if (alignment === "binance-paribu") {
      interval = setInterval(getParibuPrice, 1000);
    } else {
      connection = getBTCTicker();
    }

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
      window.removeEventListener("beforeunload", handleBeforeUnload);
      connection.close();
      clearInterval(interval);
    };
  };

  const clearStorage = async () => {
    setCombinedArray([]);
    await sessionStorage.setItem("paribuCoins", JSON.stringify([]));
    await sessionStorage.setItem("btcCoins", JSON.stringify([]));
  };

  // mounted hook
  useEffect(() => {
    clearStorage();
    mounted();
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
    (
      newRowSelectionModel: GridRowSelectionModel,
      type: "B" | "P" | "BTC" | "BP"
    ) => {
      if (newRowSelectionModel.length === combinedArray.length) {
        setDialogOpen(true);
        return;
      } else {
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

            const setBtc = () => {
              updatedCoin.fixedBtcBid = Number(data.btcBid);
              updatedCoin.fixedBtcAsk = Number(data.btcAsk);
            };

            const setParibu = () => {
              updatedCoin.fixedParibuHighestBid = data.paribuHighestBid;
              updatedCoin.fixedParibuLowestAsk = data.paribuLowestAsk;

              const unit = data.paribuUnit
                ? +data.paribuUnit
                : Number(data.paribuTotal) / Number(data.paribuLowestAsk);

              updatedCoin.paribuTotal = +unit * Number(data.paribuLowestAsk);
            };

            if (
              selectedCoins.includes(nr) &&
              !newRowSelectionModel.includes(nr)
            ) {
              updatedCoin.fixedParibuHighestBid = null;
              updatedCoin.fixedParibuLowestAsk = null;
              updatedCoin.fixedBinancePrice = null;
              updatedCoin.paribuTotal = null;
              updatedCoin.binanceTotal = null;
              updatedCoin.fixedBinanceRealPrice = null;
              updatedCoin.fixedBtcAsk = null;
              updatedCoin.fixedBtcBid = null;
            } else {
              if (type === "P") setParibu();
              else if (type === "B") setBinance();
              else if (type === "BTC") setBinance();
              else if (type === "BP") {
                setBinance();
                setParibu();
                setBtc();
              }
            }

            return updatedCoin;
          });

        updatePrice(updatedCoins);
        setSelectedCoins(newRowSelectionModel);
      }
    },
    [combinedArray, selectedCoins, updatePrice]
  );

  const isParibu: boolean = useMemo(
    () => alignment === "binance-paribu",
    [alignment]
  );

  useEffect(() => {
    clearStorage();
    mounted();
  }, [alignment]);

  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(() => {
    const paribuColumns = [
      "paribuHighestBid",
      "paribuLowestAsk",
      "fixedParibuLowestAsk",
      "fixedParibuHighestBid",
      "paribuTotal",
      "paribuAmount",
      "paribuBuy",
      "paribuSell",
      "benefitParibu",
    ].map((i) => ({ [i]: false }));

    const btcColumns = [
      "btcBid",
      "btcAsk",
      "btcTotal",
      "btcUnit",
      "btcBuy",
      "btcSell",
      "fixedBtcBid",
      "fixedBtcAsk",
      "benefitBTC",
    ].map((i) => ({
      [i]: false,
    }));

    const paribuColumnsObj = paribuColumns.reduce(
      (acc, curr, index) => ({
        ...acc,
        [Object.keys(curr)[0].toString()]: Object.values(curr)[0],
      }),
      {}
    );
    const btcColumnsObj = btcColumns.reduce(
      (acc, curr, index) => ({
        ...acc,
        [Object.keys(curr)[0].toString()]: Object.values(curr)[0],
      }),
      {}
    );

    const all = {
      ...(isParibu ? btcColumnsObj : paribuColumnsObj),
    };

    return all;
  }, [alignment]);

  return {
    updatePrice,
    createQueryString,
    setSelectedCoins,
    handleSelect,
    items,
    selectedCoins,
    combinedArray,
    loading,
    audioPlayer,
    sellList,
    setSellList,
    dialogOpen,
    setDialogOpen,
    setBinanceCoins,
    alignment,
    setAlignment,
    isParibu,
    columnVisibilityModel,
  };
};
