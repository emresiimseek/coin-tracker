import { useEffect, useState } from "react";
import axios from "axios";
import {
  BinanceCoins,
  ParibuRoot,
  ParibuCoin,
  CombinedCoin,
} from "./types/Coin";
import { TableRow } from "./TableRow";

function App() {
  const [binanceCoins, setBinanceCoins] = useState<BinanceCoins[]>([]);
  const [usdttry, setUsdttry] = useState<BinanceCoins | null>(null);
  const [paribusCoins, setParibuCoins] = useState<ParibuCoin[]>([]);
  const [combinedArray, setCombinedArray] = useState<CombinedCoin[]>([]);
  const [fixedCoins, setFixedCoins] = useState<CombinedCoin[]>([]);

  function mergeArrays(
    binanceCoins: BinanceCoins[],
    paribuCoins: ParibuCoin[]
  ): (CombinedCoin | undefined)[] {
    // Birinci dizideki her öğe için

    if (!Array.isArray(binanceCoins) || !Array.isArray(paribuCoins)) return [];

    const mergedArray = binanceCoins.map((item1) => {
      // İkinci dizideki öğeleri döngüye alarak eşleştir
      const item2 = paribuCoins.find((item) => {
        const d1 = item.symbol.split("_")[0];

        if (d1 === "USDT") return false;
        return item1.s.includes(d1);
      });
      // Eğer öğeler eşleşirse
      if (item2 && usdttry?.c) {
        // Yeni bir nesne oluşturarak birleştir

        const data: CombinedCoin = {
          symbolBinance: item1.s.replace("USDT", "_TL"),
          priceBinance: Number(item1.c) * Number(usdttry?.c),
          symbolParibu: item2.symbol,
          priceParibu: item2.last,
        };

        return data;
      }
    });
    // null olan tüm öğeleri filtrele
    return mergedArray.filter((item) => !!item);
  }

  const updatePrice = (prices: any[]) => {
    setCombinedArray((prevData) => {
      // Eski verileri kopyala
      const newDataCopy = [...prevData];

      // Yeni verileri state'e ekle
      prices.forEach((newObj) => {
        const existingObj = newDataCopy.find(
          (obj) => obj.symbolBinance === newObj.symbolBinance
        );
        if (existingObj) {
          // Eğer öğe zaten varsa, sadece alanları güncelle
          Object.assign(existingObj, newObj);
        } else {
          // Eğer öğe yoksa, diziye ekle
          newDataCopy.push(newObj);
        }
      });

      return newDataCopy;
    });
  };
  useEffect(() => {
    if (!paribusCoins.length || !binanceCoins.length || !usdttry) return;
    const list = mergeArrays(binanceCoins, paribusCoins);
    const uniqueArr: any[] = [];
    list.forEach((obj) => {
      if (
        !uniqueArr.some(
          (uniqueObj) => uniqueObj.symbolBinance === obj?.symbolBinance
        )
      ) {
        uniqueArr.push(obj);
      }

      updatePrice(uniqueArr);
    });
  }, [usdttry, paribusCoins, binanceCoins]);

  const getParibuPrice = async () => {
    const response = await axios.get<ParibuRoot>(
      "https://www.paribu.com/ticker"
    );

    const bitcoinPrice = response.data;

    const dataArray = Object.entries(bitcoinPrice).map(
      ([symbol, currency]): ParibuCoin => ({
        symbol,
        ...currency,
        allData: [currency.last],
      })
    );

    setParibuCoins((prevData) => {
      // Eski verileri kopyala
      const newDataCopy = [...prevData];

      // Yeni verileri state'e ekle
      dataArray.forEach((newObj) => {
        const existingObj = newDataCopy.find(
          (obj) => obj.symbol === newObj.symbol
        );
        if (existingObj) {
          // Eğer öğe zaten varsa, sadece alanları güncelle
          Object.assign(existingObj, newObj);
          existingObj.allData = [...existingObj.allData, ...newObj.allData];
        } else {
          // Eğer öğe yoksa, diziye ekle
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

    const socket2 = new WebSocket("wss://stream.binance.com/ws");
    socket2.onopen = () => {
      console.log("WebSocket connected 2");
      // Tüm piyasa çiftlerinin ticker verilerini isteyin
      const request2 = {
        method: "SUBSCRIBE",
        params: ["usdttry@ticker"],
        id: 2,
      };
      socket2.send(JSON.stringify(request2));
    };

    socket2.onmessage = (event) => {
      if (!event.data) return;
      const data: BinanceCoins = JSON.parse(event.data);

      setUsdttry(data);
    };

    const socket = new WebSocket("wss://fstream.binance.com/ws");

    socket.onopen = () => {
      console.log("WebSocket connected");
      // Tüm piyasa çiftlerinin ticker verilerini isteyin
      const request = {
        method: "SUBSCRIBE",
        params: ["!miniTicker@arr"],
        id: 1,
      };
      socket.send(JSON.stringify(request));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data) return;

      setBinanceCoins(data);
    };
    return () => {
      socket.close();
      socket2.close();
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
            <th>Symbol Binance</th>
            <th>Price Binance</th>
            <th>Symbol Paribu</th>
            <th>Price Paribu</th>
            <th>Difference</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {combinedArray.map((item: CombinedCoin) => (
            <TableRow
              key={item.symbolBinance}
              item={item}
              onImmobilize={(item) => {
                setFixedCoins((prev) => [...prev, item]);
              }}
              fixedCoins={fixedCoins}
              onUnImmobilize={(item) => {
                setFixedCoins((prev) => [
                  ...prev.filter((i) => i.symbolBinance !== item.symbolBinance),
                ]);
              }}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
