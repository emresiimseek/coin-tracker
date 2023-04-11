import {
  GridColDef,
  GridColumnHeaderParams,
  GridRenderCellParams,
  GridValueFormatterParams,
} from "@mui/x-data-grid";
import { useCoinTracker } from "./hooks/useCoinTracker";
import { CustomHeader } from "./CustomHeader";
import { CombinedCoin } from "./types/Coin";
import { Button, TextField } from "@mui/material";
import { NumericFormatCustom } from "./NumericFormatCustom";
import { numericFormatter } from "react-number-format";
import { Add, Remove } from "@mui/icons-material";
import { createNewOrder } from "./binance-api";

type Params = GridRenderCellParams<CombinedCoin, any, any>;
