export interface BinanceOrderRequest {
  symbol: string;
  side: "BUY" | "SELL";
  type: string;
  timestamp?: number;
  price?: string;
  quantity?: number;
  signature?: string;
  positionSide: "LONG" | "SHORT" | "BOTH";
}
