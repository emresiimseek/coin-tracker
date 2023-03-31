import { useMemo, useState } from "react";
import { CombinedCoin } from "./types/Coin";

export const TableRow = ({
  item,
  fixedCoins,
  onImmobilize,
  onUnImmobilize,
  principal,
}: {
  item: CombinedCoin;
  fixedCoins: CombinedCoin[];
  onImmobilize: (item: CombinedCoin) => void;
  onUnImmobilize: (item: CombinedCoin) => void;
  principal: number;
}) => {
  const [fixed, setFixed] = useState<CombinedCoin>();

  useMemo(() => {
    const f = fixedCoins.find((c) => c.symbolBinance === item.symbolBinance);

    setFixed(f);
  }, [fixedCoins]);

  const getProfit = () => {
    if (!fixed) return null;

    const count = principal / (fixed?.paribuLowestAsk ?? 0);
    const paribuProfit =
      item.paribuHighestBid * count - (fixed?.paribuLowestAsk ?? 0) * count;
    const binanceProfit = item.priceBinance * count;

    const b3 = (fixed?.priceBinance ?? 0) * count;
    return paribuProfit + (binanceProfit - b3) * -1;
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
        <td style={{ borderLeft: "1px solid white" }}>
          {fixed?.paribuLowestAsk ?? "---"}
        </td>
        <td>{fixed?.priceBinance ?? "---"}</td>
        <td>{getProfit() ?? "---"}</td>
        <td>
          <button
            className="action"
            style={{ backgroundColor: fixed ? "red" : "green" }}
            onClick={() => {
              fixed ? onUnImmobilize({ ...item }) : onImmobilize({ ...item });
            }}
          >
            {fixed ? "Bırak" : "Sabitle"}
          </button>
        </td>
      </tr>
    </>
  );
};
