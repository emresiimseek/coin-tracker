export interface BinanceOrderRequest {
  symbol: string;
  side: "BUY" | "SELL";
  type: string;
  timestamp?: number;
  price?: string;
  quantity?: string;
  signature?: string;
  positionSide: "LONG" | "SHORT" | "BOTH";
}
