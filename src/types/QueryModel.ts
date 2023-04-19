export interface QueryModel {
  paribuBuyPrice?: string;
  paribuSellPrice?: string;
  symbolParibu: string;
  amount: string;
  type: "sell" | "buy";
  [key: string]: any;
}
