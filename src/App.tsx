import { useEffect, useMemo, useState } from "react";
import axios from "axios";

function App() {
  const [binanceCoins, setBinanceCoins] = useState<any[]>([]);
  const [usdttry, setUsdttry] = useState<any>({});
  const [paribusCoins, setParibuCoins] = useState<any[]>([]);
  const [combinedArray, setCombinedArray] = useState<any[]>([]);

  function mergeArrays(arr1: any[], arr2: any[]) {
    // Birinci dizideki her öğe için

    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return [];

    const mergedArray = arr1.map((item1) => {
      // İkinci dizideki öğeleri döngüye alarak eşleştir
      const item2 = arr2.find((item) => {
        const d1 = item.symbol.split("_")[0];

        if (d1 === "USDT") return false;
        return item1.s.includes(d1);
      });
      // Eğer öğeler eşleşirse
      if (item2) {
        // Yeni bir nesne oluşturarak birleştir

        const data = {
          symbolBinance: item1.s,
          priceBinance: Number(item1.c) * Number(usdttry.c),
          symbolParibu: item2.symbol,
          priceParibu: item2.last,
        };

        if (Number.isNaN(data.priceBinance)) {
          console.log(data);
        }
        return data;
      }
    });
    // null olan tüm öğeleri filtrele
    return mergedArray.filter((item) => !!item);
  }

  useMemo(() => {
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

    setCombinedArray(uniqueArr);
  }, [usdttry, paribusCoins, binanceCoins]);

  useEffect(() => {
    const getPrice = async () => {
      axios
        .get("https://www.paribu.com/ticker")
        .then((response) => {
          const bitcoinPrice = response.data;
          const dataArray = Object.entries(bitcoinPrice).map(
            ([symbol, data1]) => ({
              symbol,
              ...(data1 as any),
            })
          );
          setParibuCoins(dataArray);
        })
        .catch((error) => {
          console.log(error);
        });
    };
    const interval = setInterval(() => {
      getPrice();
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
      const data = JSON.parse(event.data);

      if (!data) return;

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
    <div style={{ display: "flex" }}>
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
      </table>{" "}
    </div>
  );
}

export default App;
