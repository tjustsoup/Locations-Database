import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import KeplerGl from "kepler.gl";
import Dispatcher from "../../kepler.gl/Dispatcher";
import store from "../../kepler.gl/store";
import { toggleMapControl } from "kepler.gl/dist/actions/ui-state-actions";
import { setEditorMode } from "kepler.gl/dist/actions/vis-state-actions";
import { EDITOR_MODES } from "kepler.gl/constants";
import { useData } from "@microsoft/teamsfx-react";
import { TeamsFxContext } from "../Context";
import axios from "axios";
import { LoadingButton } from "@mui/lab";

const frameTypeList = [
  "Precise",
  "Extended",
  "Gas - Canopy",
  "Gas - Diesel",
  "Parking Lot",
  "Retail/Storefront",
  "Mall/Shopping Center",
];

export default function GeoFrameTab(props: any) {
  const { teamsfx } = React.useContext(TeamsFxContext);
  let activeRow = props.rowData.filter((e: any) => {
    return e.id === props.activeRowId;
  })[0];

  // States
  const [patchData, setPatchData] = React.useState<any>({});
  const [geoJson, setGeoJson] = React.useState<any>({});
  const [selectValue, setSelectValue] = React.useState("");
  const [createDisabled, setCreateDisabled] = React.useState(true);
  const [dialogType, setDialogType] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [snack, setSnack] = React.useState({
    open: false,
    severity: "",
    message: "",
  });

  // Handlers
  function handleSnackClose() {
    setSnack({ ...snack, open: false });
  }

  function handleSelectChange(event: SelectChangeEvent) {
    setSelectValue(event.target.value as string);
  }
  function handleGeoJsonChange(entry: any) {
    if (createDisabled === false) {
      setCreateDisabled(true);
    }
    store.dispatch(setEditorMode(EDITOR_MODES.EDIT_VERTEX));
    store.dispatch(toggleMapControl("mapDraw"));
    setGeoJson(entry);
  }
  function handleDialogClose() {
    setDialogOpen(false);
  }
  React.useEffect(() => {
    setSelectValue(geoJson.type);
  }, [geoJson]);
  Dispatcher(geoJson.geoframe);

  // Create GeoFrame button
  function createGeoFrame() {
    if (createDisabled === true) {
      setCreateDisabled(false);
    } else if (createDisabled === false) {
      setCreateDisabled(true);
    }
    store.dispatch(setEditorMode(EDITOR_MODES.DRAW_POLYGON));
    store.dispatch(toggleMapControl("mapDraw"));
  }

  // API UpdateRequest (create GeoFrame)
  const updateRequest = useData(
    async () => {
      const accessToken = await teamsfx?.getCredential().getToken([".default"]);
      return await axios({
        method: "patch",
        url: process.env.REACT_APP_API_ENDPOINT as string,
        data: [patchData],
        headers: {
          authorization: "Bearer " + accessToken?.token || "",
        },
      });
    },
    { autoLoad: false }
  );

  // After the update request, change the rowData to reflect the new activeRow
  React.useEffect(() => {
    if (updateRequest.data && !updateRequest.loading) {
      props.setRowData(
        props.rowData.map((e: any) => {
          if (e.id !== activeRow.id) {
            return e;
          } else {
            return (updateRequest.data as any).data[0];
          }
        })
      );
    }
  }, [updateRequest.data, updateRequest.loading]);

  // Submit button
  function submitBtn() {
    const features = (store.getState() as any).keplerGl.theMap.visState.editor
      .features;
    if (features.length < 1) {
      console.log("No GeoFrames present");
      setSnack({
        open: true,
        severity: "warning",
        message: "No GeoFrames present",
      });
    } else if (features.length > 1) {
      console.log("Only 1 GeoFrame allowed");
      setSnack({
        open: true,
        severity: "warning",
        message: "Only 1 GeoFrame allowed",
      });
    } else if (selectValue === undefined) {
      console.log("Frame type not selected");
      setSnack({
        open: true,
        severity: "warning",
        message: "Frame type not selected",
      });
    } else if (features.length === 1) {
      const x = {
        type: selectValue,
        esq_id: null,
        geoframe: {
          type: features[0].type,
          geometry: features[0].geometry,
          properties: features[0].properties,
        },
      };
      let changedRow = { ...activeRow };
      changedRow.GeoFrames = activeRow.GeoFrames.concat(x);
      setPatchData(changedRow);
      setDialogType("create");
      setDialogOpen(true);
    }
  }
  // Delete Button
  function deleteBtn() {
    const x = activeRow.GeoFrames.filter((e: any) => {
      return e !== geoJson;
    });
    let changedRow = { ...activeRow };
    changedRow.GeoFrames = x;
    setPatchData(changedRow);
    setDialogType("delete");
    setDialogOpen(true);
  }

  // Dialog Buttons
  function geoFrameYes() {
    updateRequest.reload();
    handleDialogClose();
    setSnack({
      open: true,
      severity: "success",
      message: `GeoFrame ${dialogType}d`,
    });
  }
  function geoFrameNo() {
    handleDialogClose();
  }

  return (
    <>
      <Grid container spacing={2} sx={{ alignItems: "center" }}>
        <Grid item>
          <Tooltip title="Create Geoframe">
            <Fab color="primary" size="small" onClick={createGeoFrame}>
              <AddIcon />
            </Fab>
          </Tooltip>
        </Grid>
        {/* <Grid item>
          <Tooltip title="Export All">
            <Fab color="primary" size="small" onClick={() => exportFunction("all")}>
              <UploadFileRoundedIcon color="secondary" />
            </Fab>
          </Tooltip>
        </Grid> */}

        {/* Buttons */}
        {activeRow.GeoFrames?.map((entry: any, index: number) => (
          <Grid item>
            <Fab size="small" onClick={() => handleGeoJsonChange(entry)}>
              {index + 1}
            </Fab>
          </Grid>
        ))}

        {/* If there are no GeoFrames - alert */}
        {activeRow.GeoFrames?.length === 0 && (
          <Grid item sx={{ ml: 1 }}>
            <Alert severity="warning">
              This location does not have any GeoFrames
            </Alert>
          </Grid>
        )}
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
          <Card>
            <Grid
              container
              sx={{
                pt: 2,
                px: 2,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Grid item>
                <FormControl>
                  <InputLabel id="select-label">Frame Type</InputLabel>
                  <Select
                    disabled={createDisabled}
                    labelId="select-label"
                    value={selectValue}
                    label="Frame Type"
                    sx={{ width: 250 }}
                    onChange={handleSelectChange}
                  >
                    {frameTypeList.map((type: string) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item>
                {/* <Button
                  variant="outlined"
                  disabled={false}
                  onClick={() => exportFunction("single")}
                  sx={{ mr: 2 }}
                >
                  Export
                </Button> */}
                <Button
                  variant="outlined"
                  disabled={false}
                  onClick={deleteBtn}
                  sx={{ mr: 2 }}
                >
                  Delete
                </Button>
                <Button
                  disabled={createDisabled}
                  variant="contained"
                  onClick={submitBtn}
                >
                  Submit
                </Button>
              </Grid>
            </Grid>

            <CardContent>
              <KeplerGl
                mapboxApiAccessToken="pk.eyJ1IjoidGp1c3Rzb3VwIiwiYSI6ImNsMWR1NzIxODAwejIzYm11Yng4cDBqc2gifQ.LkkdD6N9PvcTVXT7EJxhuA"
                id="theMap"
                width={650}
                height={480}
              />
            </CardContent>
          </Card>
        </Box>
      </Grid>

      {/* DIALOG - Submit/Delete */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          Are you sure you want to {dialogType} this GeoFrame?
        </DialogTitle>
        <DialogContent>
          <Grid container sx={{ justifyContent: "space-evenly" }}>
            <Grid item>
              <LoadingButton
                loading={updateRequest.loading}
                variant="contained"
                onClick={geoFrameYes}
              >
                Yes
              </LoadingButton>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                disabled={updateRequest.loading}
                onClick={geoFrameNo}
              >
                No
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* SNACKBAR - notifications */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ p: 1 }}
      >
        <Alert sx={{ width: "100%" }} severity={snack.severity as any}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
