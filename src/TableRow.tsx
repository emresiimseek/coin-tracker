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
      <tr
        key={item.priceBinance}
        style={{
          backgroundColor: item.isBuy ? "green" : "",
        }}
      >
        <td>{item.symbolBinance}</td>
        <td>{item.priceBinance}</td>
        <td>{item.symbolParibu}</td>
        <td>{item.paribuHighestBid}</td>
        <td>{item.paribuLowestAsk}</td>
        <td>{item.buyDiff}%</td>
        <td>{item.sellDiff}%</td>
        <TableRowButton
          symbolBinance={item.symbolBinance}
          fixedCoins={fixedCoins}
          onImmobilize={() => onImmobilize({ ...item })}
          onUnImmobilize={() => onUnImmobilize({ ...item })}
          coin={item}
        />
      </tr>
    </>
  );
};
