export interface BinanceOrderRequest {
  symbol: string;
  side: string;
  type: string;
  timestamp?: number;
  price?: string;
  quantity?: string;
  signature?: string;
}
