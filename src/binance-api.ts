import axios, { AxiosResponse } from "axios";
import { BinanceOrderRequest } from "./types/BinanceOrderRequest";
import CryptoES from "crypto-es";
import { ExchangeInfo } from "./types/ExchangeResponse";

const baseUrl = "https://fapi.binance.com";
const endpoint = "fapi/v1/order";

const proxyBaseUrl = "https://proxy-server-u3x4.onrender.com/";
const proxyLeverageEndpoint = "leverage";
const proxyMarginTypeEndpoint = "margin";

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

export const setLeverageApi = (symbol: string, leverage: string = "3") => {
  const timestamp = Date.now();

  const queryString = `symbol=${symbol}&leverage=${leverage}&timestamp=${timestamp}`;

  const signature = CryptoES.HmacSHA256(
    queryString,
    process.env.REACT_APP_API_SECRET ?? ""
  ).toString(CryptoES.enc.Hex);

  axios.post(
    `${proxyBaseUrl}${proxyLeverageEndpoint}?${queryString}&signature=${signature}`,
    null,
    {
      headers: {
        "X-MBX-APIKEY": process.env.REACT_APP_API_KEY ?? "",
        rejectUnauthorized: false,
      },
    }
  );
};

export const changeMarginType = (
  symbol: string,
  marginType: "ISOLATED" | "CROSSED" = "ISOLATED"
) => {
  const timestamp = Date.now();

  const queryString = `symbol=${symbol}&marginType=${marginType}&timestamp=${timestamp}`;

  const signature = CryptoES.HmacSHA256(
    queryString,
    process.env.REACT_APP_API_SECRET ?? ""
  ).toString(CryptoES.enc.Hex);

  axios.post(
    `${proxyBaseUrl}${proxyMarginTypeEndpoint}?${queryString}&signature=${signature}`,
    null,
    {
      headers: {
        "X-MBX-APIKEY": process.env.REACT_APP_API_KEY ?? "",
        rejectUnauthorized: false,
      },
    }
  );
};
