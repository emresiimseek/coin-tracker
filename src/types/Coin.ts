export interface BinanceCoins {
  e: string;
  E: number;
  s: string;
  c: string;
  o: string;
  h: string;
  l: string;
  v: string;
  q: string;
}

export interface ParibuCoing2 {
  symbol: string;
  lowestAsk: number;
  highestBid: number;
  low24hr: number;
  high24hr: number;
  avg24hr: number;
  volume: any;
  last: number;
  change: number;
  percentChange: number;
  chartData: any[];
}

export interface ParibuCoin {
  symbol: string;
  lowestAsk: number;
  highestBid: number;
  low24hr: number;
  high24hr: number;
  avg24hr: number;
  volume: any;
  last: number;
  change: number;
  percentChange: number;
  chartData: any[];
  allData: number[];
}

export interface Currency {
  lowestAsk: number;
  highestBid: number;
  low24hr: number;
  high24hr: number;
  avg24hr: number;
  volume: string | number;
  last: number;
  change: number;
  percentChange: number;
  chartData: any[];
  allData: number[];
}

export interface ParibuRoot {
  [key: string]: Currency;
}

export interface CombinedCoin {
  symbolBinance: string;
  priceBinance: number;
  symbolParibu: string;
  paribuLowestAsk: number;
  paribuHighestBid: number;
  isBuy: boolean;
  sellDiff: number;
  buyDiff: number;
}
