import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  Grid,
  IconButton,
  LinearProgress,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridColumns,
  GridRowModel,
  GridSelectionModel,
  GridSortModel,
  GRID_CHECKBOX_SELECTION_COL_DEF,
} from "@mui/x-data-grid";
import LoadingButton from "@mui/lab/LoadingButton";
import axios from "axios";
import React from "react";
import { useData } from "@microsoft/teamsfx-react";
import { TeamsFxContext } from "./Context";
import { useSelector, useDispatch } from "react-redux";
import { setData, resetData } from "../store/reducers/smartyDataSlice";
// Icons
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import AddIcon from "@mui/icons-material/Add";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
// Custom Components
import AddressDrawer from "./AddressDrawer/AddressDrawer";
import AddressInputGrid from "./AddressInputGrid";
import SearchBar from "./SearchBar";
import { resetFormattedRD } from "../store/reducers/formattedRowDataSlice";

// Waiting on API, these lines commented out:
// ln 175 (POST request), ln 464 (Search Bar), ln 636 (geoJSONRequest)

export default function MainPage() {
  const { teamsfx } = React.useContext(TeamsFxContext);
  const dispatch = useDispatch();
  const store = useSelector((state: any) => state);
  // Permissions - Commented Out until permissions have proper scopes
  const permissions = useSelector((state: any) => state.permissions.data);
  const canCreate = permissions.filter((e: any) => {
    if (e.domain === "locations" && e.permission === "create") {
      return true;
    }
  })[0].allow;
  const canRead = permissions.filter((e: any) => {
    if (e.domain === "locations" && e.permission === "read") {
      return true;
    }
  })[0].allow;
  const canUpdate = permissions.filter((e: any) => {
    if (e.domain === "locations" && e.permission === "update") {
      return true;
    }
  })[0].allow;
  const canDelete = permissions.filter((e: any) => {
    if (e.domain === "locations" && e.permission === "delete") {
      return true;
    }
  })[0].allow;
  // const canCreate = true;
  // const canRead = true;
  // const canUpdate = true;
  // const canDelete = true;

  // States
  const [activeRow, setActiveRow] = React.useState<string | number>();
  const [activeRowId, setActiveRowId] = React.useState("");

  const [activeDeleteRow, setActiveDeleteRow] = React.useState<
    string | number
  >();
  const [dgPage, setDgPage] = React.useState(0);
  const [dgPageSize, setDgPageSize] = React.useState(100);
  const [editParams, setEditParams] = React.useState<any>({});
  const [rowCountState, setRowCountState] = React.useState(0);
  const [rowData, setRowData] = React.useState<GridRowModel[]>([]);
  const [selectionModel, setSelectionModel] =
    React.useState<GridSelectionModel>([]);
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  // React.useEffect(() => {
  //   console.log(sortModel);
  // }, [sortModel]);

  // Handlers (Dialog + Snackbar) Functionalities
  /// Add Location
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const handleDialogOpen = () => {
    setDialogOpen(true);
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
    dispatch(resetFormattedRD());
    dispatch(resetData());
    getRequest.reload();
  };
  /// DELETE
  const [delDialog, setDelDialog] = React.useState(false);
  const handleDelDialogOpen = (id: any) => () => {
    setActiveDeleteRow(id);
    setDelDialog(true);
  };
  const handleDelDialogClose = () => {
    setActiveDeleteRow(0);
    setDelDialog(false);
  };
  /// DELETE MULTIPLE
  const [delMultipleDialog, setDelMultipleDialog] = React.useState(false);
  const handleDelMultipleDialogOpen = () => {
    setDelMultipleDialog(true);
  };
  const handleDelMultipleDialogClose = () => {
    setDelMultipleDialog(false);
  };
  /// EXPORT MULTIPLE
  const [exportMultipleDialog, setExportMultipleDialog] = React.useState(false);
  const handleExportMultipleDialogOpen = () => {
    setExportMultipleDialog(true);
  };
  const handleExportMultipleDialogClose = () => {
    setExportMultipleDialog(false);
  };
  /// UPDATE/EDIT
  const [editDialog, setEditDialog] = React.useState(false);
  const handleEditDialogClose = () => {
    setActiveRow("");
    setEditDialog(false);
  };
  /// Snackbar
  const [snackState, setSnackState] = React.useState({
    open: false,
    message: "",
    severity: "",
  });
  const handleSnackClose = () => {
    setSnackState({ ...snackState, open: false });
  };
  /// Address Components Drawer
  const [drawer, setDrawer] = React.useState(false);
  const handleDrawerOpen = (row: any) => () => {
    dispatch(resetData());
    setActiveRow(row);
    setActiveRowId(row.id)
    setDrawer(true);
  };
  const handleDrawerClose = () => {
    setActiveRow("");
    setDrawer(false);
    dispatch(resetData());
  };

  // API Calls
  /// GET request
  const getRequest = useData(
    async () => {
      if (teamsfx) {
        const accessToken = await teamsfx
          .getCredential()
          .getToken([".default"]);
        console.log(accessToken);
        const response = await axios({
          method: "get",
          url: process.env.REACT_APP_API_ENDPOINT as string,
          headers: {
            authorization: "Bearer " + accessToken?.token || "",
          },
        });
        setRowCountState(response.data.Count);
        console.log(response);
      }
    },
    { autoLoad: true }
  );

  /// POST request
  const postRequest = useData(async () => {
    if (teamsfx) {
      const accessToken = await teamsfx.getCredential().getToken([".default"]);
      const resp = await axios({
        method: "post",
        url: process.env.REACT_APP_API_ENDPOINT,
        data: {
          offSet: dgPage,
          pageSize: dgPageSize,
        },
        headers: {
          authorization: "Bearer " + accessToken?.token || "",
        },
      });
      console.log(resp);
      setRowData(resp.data);
    }
  });
  React.useEffect(() => {
    postRequest.reload();
  }, [dgPage, rowCountState, dialogOpen]);

  /// DELETE request
  const deleteRequest = useData(
    async () => {
      const accessToken = await teamsfx?.getCredential().getToken([".default"]);
      const deleteData = [
        {
          id: activeDeleteRow,
        },
      ];
      return await axios({
        method: "delete",
        url: process.env.REACT_APP_API_ENDPOINT as string,
        data: deleteData,
        headers: {
          authorization: "Bearer " + accessToken?.token || "",
        },
      });
    },
    { autoLoad: false }
  );
  //// useEffect() Handler
  React.useEffect(() => {
    if (!deleteRequest.loading && deleteRequest.data) {
      setDelDialog(false);
      setRowData(rowData.filter((row) => row.id !== activeDeleteRow));
      setSnackState({
        open: true,
        message: "Location has been deleted.",
        severity: "success",
      });
      setActiveRow("");
    }
  }, [deleteRequest.data]);

  /// DELETE MULTIPLE request
  const deleteMultipleRequest = useData(
    async () => {
      const accessToken = await teamsfx?.getCredential().getToken([".default"]);
      const deleteMultipleData = selectionModel.map((e: any) => {
        return { id: e };
      });
      return await axios({
        method: "delete",
        url: process.env.REACT_APP_API_ENDPOINT as string,
        data: deleteMultipleData,
        headers: {
          authorization: "Bearer " + accessToken?.token || "",
        },
      });
    },
    { autoLoad: false }
  );
  //// useEffect() Handler
  React.useEffect(() => {
    if (!deleteMultipleRequest.loading && deleteMultipleRequest.data) {
      setDelMultipleDialog(false);
      setSnackState({
        open: true,
        message: "Locations have been deleted.",
        severity: "success",
      });
      getRequest.reload();
    }
  }, [deleteMultipleRequest.data]);

  React.useEffect(() => {
    console.log(selectionModel)
  }, [selectionModel])

  /// UPDATE request
  const updateRequest = useData(
    async () => {
      const accessToken = await teamsfx?.getCredential().getToken([".default"]);
      const row = rowData.filter((e: any) => {
        return e.id === editParams.id
      })[0]
      const updateData = {
        ...row,
        owner: editParams.value
      }
      return await axios({
        method: "patch",
        url: process.env.REACT_APP_API_ENDPOINT as string,
        data: [updateData],
        headers: {
          authorization: "Bearer " + accessToken?.token || "",
        },
      });
    },
    { autoLoad: false }
  );
  const handleCommit = (event: any) => {
    setEditDialog(true);
    console.log(event)
    setEditParams(event);
  };
  //// useEffect() Handler
  React.useEffect(() => {
    if (!updateRequest.loading && !!updateRequest.data) {
      const array = rowData.map((row) => {
        if (row.id === editParams.id) {
          return { ...row, [editParams.field]: editParams.value };
        } else {
          return { ...row };
        }
      });
      setSnackState({
        open: true,
        message: "Location has been updated.",
        severity: "success",
      });
      setRowData(array);
      setEditParams({});
      setEditDialog(false);
    }
  }, [updateRequest.data]);

  React.useEffect(() => {
    console.log(activeRow)
  }, [activeRow])

  // ** COLUMNS **
  /// "owner" editable: UPDATE permission required
  /// "delete" GricActionCellItem: DELETE permission required
  const columns: GridColumns = [
    { ...GRID_CHECKBOX_SELECTION_COL_DEF, width: 80 },
    {
      field: "owner",
      headerName: "Owner",
      editable: canUpdate,
      flex: 1,
      type: "string",
    },
    {
      field: "id",
      headerName: "id",
      editable: false,
      flex: 1,
      type: "string",
    },
    {
      field: "actions",
      type: "actions",
      width: 100,
      cellClassName: "actions",
      getActions: ({ row, id }) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Delete">
              <DeleteIcon />
            </Tooltip>
          }
          disabled={!canDelete}
          onClick={handleDelDialogOpen(id)}
          label="Delete"
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Address Info">
              <ListAltRoundedIcon />
            </Tooltip>
          }
          onClick={handleDrawerOpen(row)}
          label="Address Info"
        />,
      ],
    },
  ];

  function exportFunction() {
    const blobData = rowData.filter((e: any) => {
      return selectionModel.includes(e.id)
    })
    
    const blob = new Blob([blobData.toString()], {
      type: "text/csv",
    });
    const href = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href,
      style: "display:none",
      download: "myData.csv",
    });
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(href);
    a.remove();
  }

  return (
    <>
      <Grid
        container
        direction="column"
        spacing={4}
        sx={{
          mt: 2,
          px: 20,
        }}
      >
        {/* Header */}
        <Grid
          item
          container
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Grid item>
            <Typography sx={{ color: "white", pb: 2 }} align="center" variant="h3">
              Locations
            </Typography>
          </Grid>
          {/* <Grid item>
            <SearchBar setRowData={setRowData} />
          </Grid> */}

          {/* Buttons */}
          <Grid item>
            {/* <Button
              variant="contained"
              onClick={handleExportMultipleDialogOpen}
              sx={{ mr: 1 }}
              disabled={selectionModel.length === 0}
            >
              <UploadFileRoundedIcon sx={{ mr: 1 }} /> Export
            </Button> */}

            {/* DELETE permissions required */}
            {canDelete ? (
              <Button
                variant="contained"
                onClick={handleDelMultipleDialogOpen}
                sx={{ mr: 1 }}
                disabled={selectionModel.length === 0}
              >
                <DeleteIcon sx={{ mr: 1 }} /> Delete
              </Button>
            ) : (
              <></>
            )}

            {/* CREATE permission required */}
            {canCreate ? (
              <Button
                variant="contained"
                onClick={handleDialogOpen}
                sx={{ mr: 5 }}
              >
                <AddIcon sx={{ mr: 1 }} /> Add Locations
              </Button>
            ) : (
              <></>
            )}

            <LoadingButton
              variant="contained"
              loading={getRequest.loading}
              onClick={getRequest.reload}
            >
              <RefreshRoundedIcon />
            </LoadingButton>
          </Grid>
        </Grid>

        {/* DataGrid */}
        <Grid item>
          <DataGrid
            checkboxSelection
            columns={columns}
            components={{ LoadingOverlay: LinearProgress }}
            initialState={{
              sorting: { sortModel: [{ field: "state", sort: "asc" }] },
            }}
            loading={getRequest.loading || postRequest.loading}
            onCellEditCommit={handleCommit}
            onPageChange={(newDgPage) => setDgPage(newDgPage)}
            onPageSizeChange={(newDgPageSize) => setDgPageSize(newDgPageSize)}
            onSelectionModelChange={(newSelectionModel) => {
              setSelectionModel(newSelectionModel);
            }}
            onSortModelChange={(newSortModel) => {
              setSortModel(newSortModel);
            }}
            pagination
            page={dgPage}
            pageSize={dgPageSize}
            paginationMode="server"
            rows={rowData}
            rowCount={rowCountState}
            rowsPerPageOptions={[100]}
            selectionModel={selectionModel}
            sortModel={sortModel}
            sx={{ height: 600, width: "100%" }}
          />
        </Grid>
      </Grid>

      {/* UPDATE dialog */}
      <Dialog
        sx={{ justifyContent: "center" }}
        open={editDialog}
        onClose={handleEditDialogClose}
      >
        <DialogTitle>
          Are you sure you would like to edit this Owner?
        </DialogTitle>
        <DialogContent>
          <Grid container sx={{ justifyContent: "space-evenly" }}>
            <Grid item>
              <LoadingButton
                loading={updateRequest.loading}
                variant="contained"
                onClick={updateRequest.reload}
              >
                Confirm
              </LoadingButton>
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={handleEditDialogClose}>
                Cancel
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* CREATE dialog */}
      <Dialog
        sx={{ justifyContent: "center" }}
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth
        maxWidth={"md"}
      >
        <DialogTitle>
          <Grid
            container
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Grid item>Add Locations</Grid>
            <Grid item>
              <IconButton onClick={handleDialogClose}>
                <ExitToAppRoundedIcon color="primary" />
              </IconButton>
            </Grid>
          </Grid>
        </DialogTitle>
        <DialogContent>
          <AddressInputGrid handleDialogClose={handleDialogClose} />
        </DialogContent>
      </Dialog>

      {/* DELETE dialog */}
      <Dialog open={delDialog} onClose={handleDelDialogClose}>
        <DialogTitle>Are you sure you want to delete?</DialogTitle>
        <DialogContent>
          <Grid container sx={{ justifyContent: "space-evenly" }}>
            <Grid item>
              <LoadingButton
                loading={deleteRequest.loading}
                variant="contained"
                onClick={deleteRequest.reload}
              >
                Delete
              </LoadingButton>
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={handleDelDialogClose}>
                Cancel
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* DELETE MULTIPLE dialog */}
      <Dialog open={delMultipleDialog} onClose={handleDelMultipleDialogClose}>
        <DialogTitle>
          {selectionModel.length} location
          {selectionModel.length === 1 ? "" : "s"} selected <br /> <br />
          Delete location{selectionModel.length === 1 ? "" : "s"}?
        </DialogTitle>
        <DialogContent>
          <Grid container sx={{ justifyContent: "space-between" }}>
            <Grid item>
              <LoadingButton
                loading={deleteMultipleRequest.loading}
                variant="contained"
                onClick={deleteMultipleRequest.reload}
              >
                Yes
              </LoadingButton>
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={handleDelDialogClose}>
                No
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* EXPORT MULTIPLE dialog */}
      <Dialog
        open={exportMultipleDialog}
        onClose={handleExportMultipleDialogClose}
      >
        <DialogTitle>
          {selectionModel.length} locations selected <br /> <br />
          Export and Download GeoFrames?
        </DialogTitle>
        <DialogContent>
          <Grid container sx={{ justifyContent: "space-between", mt: 2 }}>
            <Grid item>
              <LoadingButton
                variant="contained"
                onClick={exportFunction}
              >
                Export
              </LoadingButton>
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={handleDelDialogClose}>
                Cancel
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Address Components Drawer */}
      <Drawer anchor="right" open={drawer} onClose={handleDrawerClose}>
        <Box sx={{ width: 800 }}>
          <Box sx={{ width: "100%" }}>
            <AddressDrawer
              activeRow={activeRow}
              handleDrawerClose={handleDrawerClose}
              activeRowId={activeRowId}
              rowData={rowData}
              setRowData={setRowData}
            />
          </Box>
        </Box>
      </Drawer>

      {/* Notification Snackbars/Alerts */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={snackState.open}
        autoHideDuration={2000}
        onClose={handleSnackClose}
      >
        {/* @ts-ignore */}
        <Alert severity={snackState.severity}> {snackState.message} </Alert>
      </Snackbar>
    </>
  );
}
