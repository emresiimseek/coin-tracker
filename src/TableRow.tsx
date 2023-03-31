import { useMemo, useState } from "react";
import { CombinedCoin } from "./types/Coin";

export const TableRow = ({
  item,
  fixedCoins,
  onImmobilize,
  onUnImmobilize,
}: {
  item: CombinedCoin;
  fixedCoins: CombinedCoin[];
  onImmobilize: (item: CombinedCoin) => void;
  onUnImmobilize: (item: CombinedCoin) => void;
}) => {
  const [fixed, setFixed] = useState<CombinedCoin>();

  useMemo(() => {
    const f = fixedCoins.find((c) => c.symbolBinance === item.symbolBinance);

    setFixed(f);
  }, [fixedCoins]);

  const getProfit = () => {
    if (!fixed) return null;

    const anaPara = 10000;
    const adet = anaPara / (fixed?.paribuLowestAsk ?? 0);
    const paribuKar =
      item.paribuHighestBid * adet - (fixed?.paribuLowestAsk ?? 0) * adet;
    const binanceKar = item.priceBinance * adet;

    const b3 = (fixed?.priceBinance ?? 0) * adet;
    return paribuKar + (binanceKar - b3) * -1;
  };

  return (
    <>
      <tr
        key={item.priceBinance}
        style={{
          backgroundColor: item.isBuy ? "green" : "",
          color: item.isBuy ? "white" : "black",
        }}
      >
        <td>{item.symbolBinance}</td>
        <td>{item.priceBinance}</td>
        <td>{item.symbolParibu}</td>
        <td>{item.paribuHighestBid}</td>
        <td>{item.paribuLowestAsk}</td>
        <td>{item.buyDiff}%</td>
        <td>{item.sellDiff}%</td>
        <td>
          <button
            style={{ backgroundColor: fixed ? "red" : "green" }}
            onClick={() => {
              fixed ? onUnImmobilize({ ...item }) : onImmobilize({ ...item });
            }}
          >
            {fixed ? "Bırak" : "Sabitle"}
          </button>
        </td>
        <td>{fixed?.paribuLowestAsk}</td>
        <td>{fixed?.priceBinance}</td>
        <td>{getProfit()}</td>
      </tr>
    </>
  );
};
