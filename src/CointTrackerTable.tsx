import {
  DataGrid,
  GridFooterContainer,
  GridPagination,
} from "@mui/x-data-grid";
import SettingsModal from "./SettingsModal";
import { useCoinTracker } from "./hooks/useCoinTracker";

function CoinTracker() {
  const {
    combinedArray,
    isLoading,
    items,
    selectedCoins,
    handleSelect,
    columns,
  } = useCoinTracker();

  return (
    <div
      key={combinedArray.length || selectedCoins.length}
      style={{ maxWidth: "100vw", height: "100vh", padding: 10 }}
    >
      <DataGrid
        rows={combinedArray}
        loading={isLoading}
        disableRowSelectionOnClick
        components={{
          Footer: () => (
            <GridFooterContainer>
              <SettingsModal symbols={items} />
              <GridPagination style={{ flex: 1 }} />
            </GridFooterContainer>
          ),
        }}
        columns={columns()}
        density="standard"
        style={{ height: "98vh" }}
        checkboxSelection
        rowSelectionModel={selectedCoins}
        onRowSelectionModelChange={(rowSelectionModel) =>
          handleSelect(rowSelectionModel, "BP")
        }
        getRowClassName={(value) => {
          if (value.row.isBuy) return "buy";
          else if (
            Math.sign(value.row.sellDiff) === -1 &&
            Math.sign(value.row.buyDiff) === 1 &&
            value.row.benefit
          )
            return "sell";
          else return "";
        }}
      />
    </div>
  );
}

export default CoinTracker;
