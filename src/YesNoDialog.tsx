import React from "react";
import { Dialog, DialogTitle, DialogActions, Button } from "@mui/material";

interface YesNoDialogProps {
  title: string;
  open: boolean;
  onClose: (result: boolean) => void;
}

const YesNoDialog: React.FC<YesNoDialogProps> = ({ title, open, onClose }) => {
  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <DialogTitle>{title}</DialogTitle>
      <DialogActions>
        <Button
          onClick={() => onClose(true)}
          variant="contained"
          color="primary"
        >
          Yes
        </Button>
        <Button
          onClick={() => onClose(false)}
          variant="contained"
          color="error"
        >
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default YesNoDialog;
