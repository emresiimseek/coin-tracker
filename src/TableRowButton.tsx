import { memo, useEffect, useMemo, useState } from "react";
import { CombinedCoin } from "./types/Coin";

const TableRowButton = ({
  symbolBinance,
  fixedCoins,
  coin,
  onImmobilize,
  onUnImmobilize,
}: {
  symbolBinance: string;
  coin: CombinedCoin;
  fixedCoins: CombinedCoin[];
  onImmobilize: () => void;
  onUnImmobilize: () => void;
}) => {
  const [fixed, setFixed] = useState<CombinedCoin>();

  useEffect(() => {
    const f = fixedCoins.find((c) => c.symbolBinance === symbolBinance);

    setFixed(f);
  }, [fixedCoins]);

  const getKar = () => {
    const anaPara = 10000;
    const adet = anaPara / (fixed?.paribuLowestAsk ?? 0);
    const paribuKar =
      coin.paribuHighestBid * adet - (fixed?.paribuLowestAsk ?? 0) * adet;
    const binanceKar = coin.priceBinance * adet;

    const b3 = (fixed?.priceBinance ?? 0) * adet;
    return paribuKar + (binanceKar - b3) * -1;
  };
  return (
    <>
      <td>
        <button
          style={{ backgroundColor: fixed ? "red" : "green" }}
          onClick={() => {
            fixed ? onUnImmobilize() : onImmobilize();
          }}
        >
          <div>{fixed && `Kar: ${getKar()} `}</div>
          <div>{fixed && `Paribu: (${fixed.paribuLowestAsk})`}</div>
          <div>{fixed && `Binance: (${fixed.priceBinance})`}</div>
          {fixed ? "Bırak" : "Sabitle"}
        </button>
      </td>
    </>
  );
};

export default memo(TableRowButton);
