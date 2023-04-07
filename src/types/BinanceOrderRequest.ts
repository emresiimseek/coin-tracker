export interface BinanceOrderRequest {
  symbol: string;
  side: string;
  type: string;
  timestamp?: number;
  price?: string;
  quantity?: number;
  signature?: string;
}
