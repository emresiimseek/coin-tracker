import { GridRenderCellParams } from "@mui/x-data-grid";

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
  paribuLowestAsk?: number;
  paribuHighestBid?: number;
  isBuy: boolean;
  sellDiff: number;
  id: string;
  buyDiff: number;
  benefit?: number | null;
  benefitBTC?: number | null;
  scissors: number;
  binanceRealPrice: number;
  quantityPrecision?: number;
  pricePrecision?: number;

  paribuUnit?: number | null;
  binanceUnit?: number | null;

  paribuTotal?: number | null;
  binanceTotal?: number | null;

  fixedBinanceRealPrice?: number | null;
  fixedParibuLowestAsk?: number | null;
  fixedParibuHighestBid?: number | null;
  fixedBinancePrice?: number | null;

  btcSymbol?: string;
  btcBid?: string;
  btcAsk?: string;
  btcUnit?: number | null;
  fixedBtcAsk?: number | null;
  fixedBtcBid?: number | null;
  btcTotal?: number | null;

  [key: string]: any;
}

export type Params = GridRenderCellParams<CombinedCoin, any, any>;
export interface BTCCoin {
  pair: string;
  pairNormalized: string;
  timestamp: number;
  last: number;
  high: number;
  low: number;
  bid: number;
  ask: number;
  open: number;
  volume: number;
  average: number;
  daily: number;
  dailyPercent: number;
  denominatorSymbol: string;
  numeratorSymbol: string;
  order: number;
}

export interface BTCTickerData {
  A: string; // En iyi satış emri fiyatı
  AA: string; // En iyi satış emri miktarı
  AV: string; // Ortalama fiyat
  B: string; // En iyi alış emri fiyatı
  BA: string; // En iyi alış emri miktarı
  D: string; // Günlük değişim miktarı
  DP: string; // Son 24 saatteki değişim oranı
  DS: string; // Payda Sembolü. Örneğin BTCTRY TRY.
  H: string; // Son 24 saatteki en yüksek fiyat
  L: string; // Son 24 saatteki en düşük fiyat
  LA: string; // Son işlem fiyatı
  NS: string; // Pay Sembolü. Örneğin BTCTRY için BTC.
  O: string; // Günün ilk işlem fiyatı
  Ord: number; // Emir Id değeri
  PId: number; // Çift Id değeri
  PS: string; // Çift Sembolü. Örneğin BTCTRY
  V: string; // Hacim
}
