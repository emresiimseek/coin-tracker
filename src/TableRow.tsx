import { useEffect, useMemo, useState } from "react";
import TableRowButton from "./TableRowButton";
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
  return (
    <>
      <tr key={item.priceBinance + item.priceParibu}>
        <td>{item.symbolBinance}</td>
        <td>{item.priceBinance}</td>
        <td>{item.symbolParibu}</td>
        <td>{item.priceParibu}</td>
        <td>{item.priceParibu - item.priceBinance}</td>
        <TableRowButton
          symbolBinance={item.symbolBinance}
          fixedCoins={fixedCoins}
          onImmobilize={() => onImmobilize({ ...item })}
          onUnImmobilize={() => onUnImmobilize({ ...item })}
        />
      </tr>
    </>
  );
};
