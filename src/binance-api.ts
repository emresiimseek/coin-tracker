import axios from "axios";
import { BinanceOrderRequest } from "./types/BinanceOrderRequest";
import CryptoES from "crypto-es";

const baseUrl = "https://fapi.binance.com";
const endpoint = "fapi/v1/order";

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
