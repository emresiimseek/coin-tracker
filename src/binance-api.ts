import axios, { AxiosResponse } from "axios";
import { BinanceOrderRequest } from "./types/BinanceOrderRequest";
import CryptoES from "crypto-es";
import { ExchangeInfo } from "./types/ExchangeResponse";

const baseUrl = "https://fapi.binance.com";
const endpoint = "fapi/v1/order";
const endpoint2 = "/fapi/v1/leverage";

export const createNewOrder = async (request: BinanceOrderRequest) => {
  request.timestamp = Date.now();
  const queryString = `symbol=${request.symbol}&price=${request.price}&quantity=${request.quantity}&side=${request.side}&timestamp=${request.timestamp}&type=${request.type}&timeInForce=GTC`;

  const signature = CryptoES.HmacSHA256(
    queryString,
    process.env.REACT_APP_API_SECRET ?? ""
  ).toString(CryptoES.enc.Hex);

  try {
    await axios.post(
      `${baseUrl}/${endpoint}?${queryString}&signature=${signature}`,
      null,
      {
        headers: {
          "X-MBX-APIKEY": process.env.REACT_APP_API_KEY ?? "",
        },
      }
    );
  } catch (error: any) {
    alert(error.response.data.msg);
  }
};

export const getExchange = async () => {
  const response: AxiosResponse<ExchangeInfo> = await axios.get(
    "https://fapi.binance.com/fapi/v1/exchangeInfo"
  );

  const usdtCoins = response.data.symbols.filter(
    (c) => c.quoteAsset === "USDT"
  );

  return usdtCoins;
};

export const setLeverage = (symbol: string) => {
  const timestamp = Date.now();
  const leverage = 3;

  const queryString = `symbol=${symbol}&leverage=${leverage}&timestamp=${timestamp}`;

  const signature = CryptoES.HmacSHA256(
    queryString,
    process.env.REACT_APP_API_SECRET ?? ""
  ).toString(CryptoES.enc.Hex);

  axios.post(
    `${baseUrl}/${endpoint2}?${queryString}&signature=${signature}`,
    null,
    {
      headers: {
        "X-MBX-APIKEY": process.env.REACT_APP_API_KEY ?? "",
      },
    }
  );
};
