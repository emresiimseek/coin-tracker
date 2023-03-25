import { useEffect, useState } from "react";
import BitcoinPrice from "./Paribu";

function App() {
  const [coins, setCoins] = useState<any[]>([]);
  const [usdttry, setUsdttry] = useState<any>({});
  const [price, setPrice] = useState(null);

  useEffect(() => {
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

      setCoins(data);
    };

    return () => {
      socket.close();
      socket2.close();
    };
  }, []);
  const columns = coins.length ? Object.keys(coins[0]) : [];

  return (
    <div style={{ display: "flex" }}>
      <BitcoinPrice />
      {/* <div>{usdttry.c} </div> */}
      {!!coins.length && (
        <table border={1}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coins.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col}>
                    {col === "c" ? row[col] * usdttry.c : row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
