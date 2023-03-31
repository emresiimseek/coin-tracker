import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  BinanceCoins,
  ParibuRoot,
  ParibuCoin,
  CombinedCoin,
} from "./types/Coin";
import TableRow from "./TableRow";

const BINANCE_WEBSOCKET_URL = "wss://stream.binance.com/ws";
const FS_BINANCE_WEBSOCKET_URL = "wss://fstream.binance.com/ws";
const PARIBU_API_URL = "https://www.paribu.com/ticker";

function CoinTracker() {
  const [binanceCoins, setBinanceCoins] = useState<BinanceCoins[]>([]);
  const [usdttry, setUsdttry] = useState<BinanceCoins | null>(null);
  const [paribusCoins, setParibuCoins] = useState<ParibuCoin[]>([]);
  const [combinedArray, setCombinedArray] = useState<CombinedCoin[]>([]);
  const [fixedCoins, setFixedCoins] = useState<CombinedCoin[]>([]);

  const handleImmobilize = useCallback(
    (item: any) => {
      setFixedCoins((prev) => [...prev, item]);
    },
    [fixedCoins]
  );

  const handleUnImmobilize = useCallback(
    (item: any) => {
      setFixedCoins((prev) => [
        ...prev.filter((i) => i.symbolBinance !== item.symbolBinance),
      ]);
    },
    [fixedCoins]
  );

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
    setCombinedArray((prevData) => {
      let newDataCopy = [...prevData];

      prices.forEach((newObj) => {
        const existingObj = newDataCopy.find(
          (obj) => obj.symbolBinance === newObj.symbolBinance
        );
        if (existingObj) {
          Object.assign(existingObj, newObj);
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

  return (
    <div
      key={combinedArray.length || fixedCoins.length}
      style={{ maxWidth: "100%" }}
    >
      <table>
        <thead>
          <tr>
            <th>Binance Sembol</th>
            <th>Binance Fiyat</th>
            <th>Paribu Sembol</th>
            <th>Paribu Satış</th>
            <th>Paribu Alış</th>
            <th>Alış Yüzde</th>
            <th>Satış Yüzde</th>
            <th>İşlem</th>
            <th>Sabit Paribu Alış</th>
            <th>Sabit Binance Fiyat</th>
            <th>Kar</th>
          </tr>
        </thead>
        <tbody>
          {combinedArray.map((item: CombinedCoin) => (
            <TableRow
              key={item.symbolBinance}
              item={item}
              onImmobilize={handleImmobilize}
              fixedCoins={fixedCoins}
              onUnImmobilize={handleUnImmobilize}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CoinTracker;
