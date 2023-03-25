import { memo, useEffect, useMemo, useState } from "react";
import { CombinedCoin } from "./types/Coin";

const TableRowButton = ({
  symbolBinance,
  fixedCoins,
  onImmobilize,
  onUnImmobilize,
}: {
  symbolBinance: string;
  fixedCoins: CombinedCoin[];
  onImmobilize: () => void;
  onUnImmobilize: () => void;
}) => {
  const [fixed, setFixed] = useState<CombinedCoin>();

  useEffect(() => {
    const f = fixedCoins.find((c) => c.symbolBinance === symbolBinance);

    setFixed(f);
  }, [fixedCoins]);
  return (
    <>
      <td>
        <button
          style={{ backgroundColor: fixed ? "red" : "green" }}
          onClick={() => {
            fixed ? onUnImmobilize() : onImmobilize();
          }}
        >
          {fixed
            ? `Bırak (${fixed?.priceBinance - fixed.priceParibu})`
            : "Sabitle"}
        </button>
      </td>
    </>
  );
};

export default memo(TableRowButton);
