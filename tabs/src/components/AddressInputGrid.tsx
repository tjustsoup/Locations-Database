import React from "react";
import {
  DataGrid,
  GridActionsCellItem,
  GridColumns,
  GridRowModel,
  GridRowId,
} from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  AlertColor,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import Papa from "papaparse";
import SmartyAPICall from "./SmartyAPICall";
import { useDispatch, useSelector } from "react-redux";
import { setData, resetData } from "../store/reducers/smartyDataSlice";
import { useData } from "@microsoft/teamsfx-react";
import { TeamsFxContext } from "./Context";
import axios from "axios";
import md5 from "md5";
import {
  resetFormattedRD,
  setFormattedRD,
} from "../store/reducers/formattedRowDataSlice";
// Icons
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import SendIcon from "@mui/icons-material/Send";
import InfoTwoToneIcon from "@mui/icons-material/InfoTwoTone";

export default function AddressInputGrid(props: any) {
  const dispatch = useDispatch();
  const store = useSelector((state: any) => state.smartyData);
  const mainStore = useSelector((state: any) => state);
  const { teamsfx } = React.useContext(TeamsFxContext);

  // Handlers + States
  /// Snackbar
  const [rowData, setRowData] = React.useState<GridRowModel[]>([]);
  // React.useEffect(() => console.log(rowData), [rowData])
  const [snackState, setSnackState] = React.useState({
    open: false,
    message: "",
    severity: "",
  });
  const handleSnackClose = () => {
    setSnackState({ ...snackState, open: false });
  };
  /// Add entry
  const addValue = () => {
    setRowData((prevRows: any) => [
      ...prevRows,
      { id: uuidv4(), md5: "", owner: "", address: "" },
    ]);
  };
  const handleCommit = (event: any) => {
    setRowData(
      rowData.map((row) => {
        if (row.id === event.id) {
          return { ...row, [event.field]: event.value };
        } else {
          return { ...row };
        }
      })
    );
  };
  /// Delete entry
  const handleDelete = (id: GridRowId) => () => {
    setRowData(rowData.filter((row) => row.id !== id));
    if (store.data.length > 0) {
      dispatch(
        setData(store.data.filter((entry: any) => entry.inputId !== id))
      );
    }
    if (mainStore.formattedRowData.data.length > 0) {
      dispatch(
        setFormattedRD(
          mainStore.formattedRowData.data.filter(
            (entry: any) => entry.id !== id
          )
        )
      );
    }
  };

  /// Dialog functionality
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  //// Toggle
  const [checked, setChecked] = React.useState(false);
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
  };

  //// Papa Parse
  const [text, setText] = React.useState("");
  const handleTextChange = (event: any) => {
    setText(event.target.value);
  };
  const [wideText, setWideText] = React.useState("");
  const handleWideTextChange = (event: any) => {
    setWideText(event.target.value);
  };

  const columns: GridColumns = [
    {
      field: "status",
      align: "center",
      headerAlign: "center",
      headerName: "Status",
      width: 80,
    },
    { field: "owner", headerName: "Owner", flex: 1, editable: true },
    { field: "address", headerName: "Address", flex: 1.5, editable: true },
    {
      field: "actions",
      type: "actions",
      headerName: (
        <>
          <Tooltip title="Add Row">
            <IconButton onClick={addValue}>
              <AddIcon color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Mass Input">
            <IconButton onClick={() => handleClickOpen()}>
              <PlaylistAddIcon color="primary" />
            </IconButton>
          </Tooltip>
        </>
      ) as any,
      width: 100,
      cellClassName: "actions",
      getActions: ({ id }) => [
        <GridActionsCellItem
          icon={<DeleteIcon />}
          onClick={handleDelete(id)}
          label="Delete"
        />,
      ],
    },
  ];

  /// Parse mass input data, add lines in data grid, and send data to those lines
  function submitText() {
    if (checked === false) {
      const result = Papa.parse(text);
      const newData = result.data.map((entry: any) => {
        let text = "";
        for (let i = 1; i < entry.length; i++) {
          text += entry[i];
        }
        return {
          id: uuidv4(),
          owner: entry[0],
          address: text,
        };
      });
      setRowData(rowData.concat(newData));
    } else if (checked === true) {
      // Papa parses the incoming data
      const result = Papa.parse(wideText);
      // Changing all "Null" values to "" - helps in validation process
      const endResult = result.data.map((array: any) => {
        return array.map((entry: any) => {
          return entry.replace("NULL", "");
        });
      });
      // Sets the final array of objects in proper format
      const newData = endResult.map((entry: any) => {
        return {
          id: entry[0],
          esq_id: entry[1],
          owner: entry[2],
          address: `${entry[3] || ""} ${entry[4] || ""} ${entry[5] || ""} ${
            entry[6] || ""
          } ${entry[7] || ""} ${entry[8] || ""} ${entry[9] || ""} ${
            entry[10] || ""
          } ${entry[11] || ""} ${entry[12] || ""}-${entry[13] || ""} `,
        };
      });
      setRowData(rowData.concat(newData));
    }
    handleClose();
  }

  // API CALLS
  /// Step 1
  /* Validate Button onClick - Smarty API Call */
  //// Validate Button disabled while any Address Field is empty
  const [validateDisabled, setValidateDisabled] = React.useState(false);
  const [validationTrigger, setValidationTrigger] = React.useState(false);
  function validate() {
    if (rowData.length > 0) {
      const blanks = rowData.filter(
        (e: any) => e.address === undefined || e.address.length === 0
      ).length;
      if (blanks === 0) {
        dispatch(resetData());
        SmartyAPICall(rowData)
          .then((e: any) => {
            let totalLookups: any = [];
            e.forEach((batch: any) => {
              totalLookups = totalLookups.concat(batch.lookups);
            });

            dispatch(setData(totalLookups));
            // console.log(totalLookups)
          })
          .then(() => setValidationTrigger(true));
      } else if (blanks > 0) {
        console.log("One or more address fields are empty.");
        setSnackState({
          open: true,
          message: "One or more address fields are empty",
          severity: "warning",
        });
      }
    } else {
      console.log("No data present");
      setSnackState({
        open: true,
        message: "No entries present.",
        severity: "warning",
      });
    }
  }

  /// Step 2
  /* AFTER Smarty API call: this formats the data to prep for the next duplicate-check API call */
  React.useEffect(() => {
    if (validationTrigger === true) {
      if (store.data) {
        if (store.data.length > 0) {
          // x is an array of returned Smarty data, formatted per the Datagrid
          const x = store.data.map((entry: any) => {
            // If we have a result, Smarty found a VALID address
            if (entry.result.length > 0) {
              return {
                id: entry.inputId,
                owner: entry.addressee,
                md5: md5(JSON.stringify(entry.result[0].components)),
                address:
                  entry.result[0].deliveryLine1 +
                  ", " +
                  entry.result[0].lastLine,
              };
              // If we DON'T have a result, Smarty says our address is INVALID
            } else if (entry.result.length === 0) {
              return {
                status: "Invalid",
                id: entry.inputId,
                owner: entry.addressee,
                address: entry.street,
              };
            }
          });
          dispatch(setFormattedRD(x)); // Saves current formattedRowData to store
          setmd5Array(x.map((e: any) => e.md5)); // Sets md5Array to be used for Dupes API Call
          setValidationTrigger(false);
        }
      }
    }
  }, [validationTrigger]);

  /// STEP 3
  /* AFTER Data is formatted: checks for duplicates via md5 hash */
  const [md5Array, setmd5Array] = React.useState([]);
  // Triggers API Call, only if md5Array has length > 0
  React.useEffect(() => {
    if (md5Array.length > 0) {
      duplicateCheckRequest.reload();
    }
  }, [md5Array]);

  /// API Call defined here
  const duplicateCheckRequest = useData(
    async () => {
      const accessToken = await teamsfx?.getCredential().getToken([".default"]);
      const postData = {
        md5: md5Array.toString(),
      };
      await axios
        .post(process.env.REACT_APP_API_ENDPOINT as string, postData, {
          headers: { Authorization: "Bearer " + accessToken?.token || "" },
        })
        .then((e: any) => {
          console.log(e);
          // instantiates array of duplicates from API response
          const duplicatesArray = (e.data as any).map(
            (entry: any) => entry.ValidatedAddresses.SmartyStreets.md5
          );
          // instantiates array of Objects with new stasuses (via .push())
          let statusAddedArray: any = [];
          // We don't want to change the status of Invalid Objects
          const arrayWithoutInvalids = mainStore.formattedRowData.data.filter(
            (e: any) => e.status !== "Invalid"
          );
          arrayWithoutInvalids.forEach((entry: any) => {
            if (
              duplicatesArray.filter((md5: any) => md5 === entry.md5).length > 0
            ) {
              const duplicateObj = {
                status: "Duplicate",
                owner: entry.owner,
                id: entry.id,
                md5: entry.md5,
                address: entry.address,
              };
              statusAddedArray.push(duplicateObj);
            } else {
              const validObj = {
                status: "✅",
                owner: entry.owner,
                id: entry.id,
                md5: entry.md5,
                address: entry.address,
              };
              statusAddedArray.push(validObj);
            }
          });
          // Adding the "Invalids" back in
          const fullNewArray = statusAddedArray.concat(
            mainStore.formattedRowData.data.filter(
              (e: any) => e.status === "Invalid"
            )
          );
          dispatch(setFormattedRD(fullNewArray));
          setRowData(fullNewArray);
          setmd5Array([]);
        });
    },
    { autoLoad: false }
  );

  /* End of Steps */

  /// Submit Button
  //// Submit button disabled unless all statuses are "✅"
  const [submitDisabled, setSubmitDisabled] = React.useState(true);
  React.useEffect(() => {
    if (rowData.length > 0) {
      if (rowData.filter((row: any) => row.status !== "✅").length === 0) {
        setSubmitDisabled(false);
      } else {
        setSubmitDisabled(true);
      }
    }
  }, [rowData]);

  //// First PUT request sends "owners" off to be created in database
  //// This is required before we can send the smartyStreets address components
  const submitRequest = useData(
    async () => {
      const accessToken = await teamsfx?.getCredential().getToken([".default"]);
      console.log(accessToken);
      console.log(store.data);
      let putData;
      if (store.data.length > 0) {
        putData = store.data.map((e: any) => {
          return {
            owner: e.addressee,
            ValidatedAddresses: {
              SmartyStreets: {
                md5: md5(JSON.stringify(e.result[0].components)),
                latitude: e.result[0].metadata.latitude,
                longitude: e.result[0].metadata.longitude,
                cityName: e.result[0].components.cityName || "",
                defaultCityName: e.result[0].components.defaultCityName || "",
                deliveryPoint: e.result[0].components.deliveryPoint || "",
                deliveryPointCheckDigit:
                  e.result[0].components.deliveryPointCheckDigit || "",
                extraSecondaryDesignator:
                  e.result[0].components.extraSecondaryDesignator || "",
                extraSecondaryNumber:
                  e.result[0].components.extraSecondaryNumber || "",
                plus4Code: e.result[0].components.plus4Code || "",
                pmbDesignator: e.result[0].components.pmbDesignator || "",
                pmbNumber: e.result[0].components.pmbNumber || "",
                primaryNumber: e.result[0].components.primaryNumber || "",
                secondaryDesignator:
                  e.result[0].components.secondaryDesignator || "",
                secondaryNumber: e.result[0].components.secondaryNumber || "",
                state: e.result[0].components.state || "",
                streetName: e.result[0].components.streetName || "",
                streetPostdirection:
                  e.result[0].components.streetPostdirection || "",
                streetPredirection:
                  e.result[0].components.streetPredirection || "",
                streetSuffix: e.result[0].components.streetSuffix || "",
                urbanization: e.result[0].components.urbanization || "",
                zipCode: e.result[0].components.zipCode || "",
              },
              GooglePlaces: {},
            },
            GeoFrame: [],
          };
        });
      }
      dispatch(resetData());
      dispatch(resetFormattedRD());
      console.log(putData);
      return await axios
        .put(process.env.REACT_APP_API_ENDPOINT as string, putData, {
          headers: { Authorization: "Bearer " + accessToken?.token || "" },
        })
        .then(() => props.handleDialogClose());
    },
    { autoLoad: false }
  );

  // Delete-All Buttons
  /// Setting arrays divided by each status
  const [valids, setValids] = React.useState([]);
  const [dupes, setDupes] = React.useState([]);
  const [invalids, setInvalids] = React.useState([]);
  React.useEffect(() => {
    if (mainStore.formattedRowData.data.length > 0) {
      const dupeArray = mainStore.formattedRowData.data.filter(
        (e: any) => e.status === "Duplicate"
      );
      setDupes(dupeArray);
      const validArray = mainStore.formattedRowData.data.filter(
        (e: any) => e.status === "✅"
      );
      setValids(validArray);
      const invalidArray = mainStore.formattedRowData.data.filter(
        (e: any) => e.status === "Invalid"
      );
      setInvalids(invalidArray);
    } else if (mainStore.formattedRowData.data.length === 0) {
      setDupes([]);
      setValids([]);
      setInvalids([]);
    }
    console.log(mainStore);
  }, [mainStore.formattedRowData.data]);

  // (choice = "Invalids" || "Duplicates")
  function deleteAll(choice: string) {
    // Creates an array of the ID's corresponding to the entries that are NOT of the given "Status"
    const idArray = rowData
      .filter((e: any) => e.status !== choice)
      .map((e: any) => e.id);
    // Array to replace the Data Store
    /// Array consisting of any item in the Data Store that shares an ID with the idArray
    const newStoreData = store.data.filter((e: any) => {
      if (idArray.includes(e.inputId)) {
        return e;
      }
    });

    dispatch(setData(newStoreData));
    dispatch(
      setFormattedRD(
        mainStore.formattedRowData.data.filter((e: any) => e.status !== choice)
      )
    );
    setRowData(rowData.filter((e: any) => e.status !== choice));
  }

  return (
    <>
      <Grid container sx={{ justifyContent: "space-between" }} spacing={2}>
        <Grid item xs={12}>
          <DataGrid
            components={{ LoadingOverlay: LinearProgress }}
            loading={duplicateCheckRequest.loading}
            onCellEditCommit={handleCommit}
            onCellEditStart={() => setValidateDisabled(true)}
            onCellEditStop={() => setValidateDisabled(false)}
            rows={rowData}
            columns={columns}
            sx={{ height: 560, width: "100%" }}
          />
        </Grid>
        <Grid item container sx={{ justifyContent: "space-around" }} xs={12}>
          <Grid item>Valid Locations: {valids.length}</Grid>
          <Grid item>Invalid Locations: {invalids.length}</Grid>
          <Grid item>Duplicate Locations: {dupes.length}</Grid>
        </Grid>
        <Grid item>
          <Button
            disabled={validateDisabled}
            variant={"contained"}
            onClick={validate}
          >
            Validate
            <CloudDoneRoundedIcon sx={{ ml: 1 }} />
          </Button>
        </Grid>
        <Grid item>
          <Button
            disabled={invalids.length === 0}
            variant={"outlined"}
            onClick={() => deleteAll("Invalid")}
          >
            Delete Invalids
            <DeleteIcon sx={{ ml: 1 }} />
          </Button>
        </Grid>
        <Grid item>
          <Button
            disabled={dupes.length === 0}
            variant={"outlined"}
            onClick={() => deleteAll("Duplicate")}
          >
            Delete Duplicates
            <DeleteIcon sx={{ ml: 1 }} />
          </Button>
        </Grid>
        <Grid item>
          <Button
            disabled={submitDisabled}
            variant={"contained"}
            onClick={() => submitRequest.reload()}
          >
            Submit
            <SendIcon sx={{ ml: 1 }} />
          </Button>
        </Grid>
      </Grid>

      {/* Mass Input Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle id="Mass Input">
          Copy and Paste your CSV list here
        </DialogTitle>
        <DialogContent sx={{ minWidth: 600 }}>
          {checked ? (
            <TextField
              multiline
              placeholder={`Use "Esq Import" to import from the Esquire GeoJSON Master`}
              rows={10}
              variant="outlined"
              fullWidth
              value={wideText}
              onChange={handleWideTextChange}
            />
          ) : (
            <TextField
              multiline
              placeholder={`owner1, address1,                                                                                   owner2, address2,`}
              rows={10}
              variant="outlined"
              fullWidth
              value={text}
              onChange={handleTextChange}
            />
          )}
          <Grid container sx={{ justifyContent: "space-between", pt: 3 }}>
            <Grid item>
              <Button variant="contained" onClick={() => setText("")}>
                Clear
              </Button>
            </Grid>
            <Grid item>
              <FormControl>
                <FormControlLabel
                  value="Esq Import"
                  control={
                    <Switch checked={checked} onChange={handleSwitchChange} />
                  }
                  label="Esq Import"
                  labelPlacement="end"
                />
              </FormControl>
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={submitText}>
                Submit
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Notification Snackbars/Alerts */}
      <Snackbar
        sx={{ mt: 8 }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={snackState.open}
        autoHideDuration={2000}
        onClose={handleSnackClose}
      >
        <Alert severity={snackState.severity as AlertColor}>
          {snackState.message}
        </Alert>
      </Snackbar>
    </>
  );
}
