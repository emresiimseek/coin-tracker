import { Box, IconButton, Modal, ToggleButtonGroup } from "@mui/material";
import { useEffect, useState } from "react";
import TimelineIcon from "@mui/icons-material/Timeline";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function ChartModal({
  datas,
  symbol,
}: {
  datas: { value: number; time: string }[];
  symbol: string;
}) {
  const [open, setOpen] = useState(false);
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

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <>
      <IconButton onClick={handleOpen}>
        <TimelineIcon style={{ marginLeft: 5 }} />
      </IconButton>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Line
            data={{
              labels: datas.map((data) => data.time),
              datasets: [
                {
                  data: datas.map((data) => data.value),
                  label: symbol,
                  borderColor: "rgb(53, 162, 235)",
                  backgroundColor: "rgba(53, 162, 235, 0.5)",
                },
              ],
            }}
          />
        </Box>
      </Modal>
    </>
  );
}

export default ChartModal;
