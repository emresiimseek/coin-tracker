import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BinanceCoins,
  ParibuRoot,
  ParibuCoin,
  CombinedCoin,
} from "./types/Coin";

function App() {
  const [binanceCoins, setBinanceCoins] = useState<BinanceCoins[]>([]);
  const [usdttry, setUsdttry] = useState<BinanceCoins | null>(null);
  const [paribusCoins, setParibuCoins] = useState<ParibuCoin[]>([]);
  const [combinedArray, setCombinedArray] = useState<CombinedCoin[]>([]);
  const [allCoins, setAllCoins] = useState<CombinedCoin[]>([]);

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
          symbolBinance: item1.s,
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
    });

    setCombinedArray((prevData) => {
      // Eski verileri kopyala
      const newDataCopy = [...prevData];

      // Yeni verileri state'e ekle
      uniqueArr.forEach((newObj) => {
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
  const columns = binanceCoins.length ? Object.keys(binanceCoins[0]) : [];

  return (
    <div key={combinedArray.length} style={{ minWidth: "100%" }}>
      <table border={1}>
        <thead>
          <tr>
            <th>Symbol Binance</th>
            <th>Price Binance</th>
            <th>Symbol Paribu</th>
            <th>Price Paribu</th>
          </tr>
        </thead>
        <tbody>
          {combinedArray.map(
            ({ symbolBinance, priceBinance, symbolParibu, priceParibu }) => (
              <tr key={priceBinance + priceParibu}>
                <td>{symbolBinance}</td>
                <td>{priceBinance}</td>
                <td>{symbolParibu}</td>
                <td>{priceParibu}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
