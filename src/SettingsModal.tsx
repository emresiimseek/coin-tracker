import {
  Box,
  Modal,
  IconButton,
  Button,
  Input,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useState, memo } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import { Symbol, Filter } from "./types/ExchangeResponse";
import {
  DataGrid,
  GridCellParams,
  GridColDef,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { changeMarginType, setLeverageApi } from "./binance-api";
export const SettingsModal = ({ symbols }: { symbols: Symbol[] }) => {
  const [open, setOpen] = useState(false);
  const [selectedCoins, setSelectedCoins] = useState<GridRowSelectionModel>([]);
  const [leverage, setLeverage] = useState<string>("");
  const [marginType, setMarginType] = useState<"ISOLATED" | "CROSSED">(
    "ISOLATED"
  );

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const style = {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "95vw",
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 1,
    p: 2,
  };

  const columns: GridColDef[] = [
    {
      field: "symbol",
      headerName: "Sembol",
      description: "Sembol",
      flex: 1,
    },
    {
      field: "maintMarginPercent",
      headerName: "Maint Margin %",
      flex: 1,
      description: "Maint Margin %",
    },
    {
      field: "requiredMarginPercent",
      headerName: "Required Margin %",
      flex: 1,
      description: "Required Margin %",
    },
    {
      field: "pricePrecision",
      headerName: "Price Precision",
      flex: 1,
      description: "Price Precision",
    },
    {
      field: "quantityPrecision",
      headerName: "Quantity Precision",
      flex: 1,
      description: "Quantity Precision",
    },
    {
      field: "baseAsset",
      headerName: "Base Asset",
      flex: 1,
      description: "Base Asset",
    },
    {
      field: "quoteAsset",
      headerName: "Quote Asset",
      flex: 1,
      description: "Quote Asset",
    },
    {
      field: "marginAsset",
      headerName: "Margin Asset",
      flex: 1,
      description: "Margin Asset",
    },
    {
      field: "filters",
      headerName: "Filters",
      flex: 1,
      description: "Filters",
      renderCell: (params: GridCellParams) => {
        const filters = params.value as Filter[];
        return (
          <>
            {filters.map((filter) => (
              <div key={filter.filterType}>
                {filter.filterType}:{" "}
                {Object.entries(filter)
                  .filter(([key]) => key !== "filterType")
                  .map(([key, value]) => `${key}=${value}`)
                  .join(", ")}
              </div>
            ))}
          </>
        );
      },
    },
  ];

  return (
    <>
      <IconButton onClick={handleOpen}>
        <SettingsIcon />
      </IconButton>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
            <TextField
              value={leverage}
              size="small"
              label="Kaldıraç Değeri"
              onChange={(event) => setLeverage(event.target.value)}
            />

            <Button
              variant="outlined"
              onClick={() =>
                selectedCoins.map((coin) =>
                  setLeverageApi(coin.toString(), leverage)
                )
              }
            >
              Kaldıraç Ayarla
            </Button>

            <FormControl>
              <InputLabel id="demo-simple-select-autowidth-label">
                Margin Tipi
              </InputLabel>
              <Select
                labelId="demo-simple-select-autowidth-label"
                id="demo-simple-select-autowidth"
                size="small"
                value={marginType}
                onChange={(event) =>
                  setMarginType(event.target.value as "ISOLATED" | "CROSSED")
                }
                autoWidth
                label="Age"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value={"ISOLATED"}>ISOLATED</MenuItem>
                <MenuItem value={"CROSSED"}>CROSSED</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={() => {
                selectedCoins.map((coin) =>
                  changeMarginType(coin.toString(), marginType)
                );
              }}
            >
              Margin Ayarla
            </Button>
          </div>

          <DataGrid
            rows={symbols}
            columns={columns}
            density="compact"
            style={{ height: "90vh" }}
            checkboxSelection
            getRowId={(row: Symbol) => row.symbol}
            rowSelectionModel={selectedCoins}
            onRowSelectionModelChange={(newRowSelectionModel) => {
              setSelectedCoins(newRowSelectionModel);
            }}
          />
        </Box>
      </Modal>
    </>
  );
};

export default memo(SettingsModal);
