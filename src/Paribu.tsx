import React, { useState, useEffect, useLayoutEffect } from "react";
import axios from "axios";
import { json } from "stream/consumers";

function BitcoinPrice() {
  const [price, setPrice] = useState<any[]>([]);

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
          setPrice(dataArray);
        })
        .catch((error) => {
          console.log(error);
        });
    };
    const interval = setInterval(() => {
      getPrice();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <table border={1}>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Last Price</th>
          <th>24h High</th>
          <th>24h Low</th>
          <th>24h Volume</th>
        </tr>
      </thead>
      <tbody>
        {price.map(({ symbol, last, high24hr, low24hr, volume }) => (
          <tr key={symbol}>
            <td>{symbol}</td>
            <td>{last}</td>
            <td>{high24hr}</td>
            <td>{low24hr}</td>
            <td>{volume}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default React.memo(BitcoinPrice);
