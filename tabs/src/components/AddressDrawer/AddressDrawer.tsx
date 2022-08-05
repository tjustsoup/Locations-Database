import {
  Box,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { v4 as uuidv4 } from "uuid";
import React from "react";
import { Provider, useSelector } from "react-redux";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import TabPanel from "./TabPanel";
import a11yProps from "./a11yProps";
import GeoFrameTab from "./GeoFrameTab";
import keplerStore from "../../kepler.gl/store";

export default function AddressDrawer(props: any) {
  const store = useSelector((state: any) => state);
  // Tab Handling
  const [tabValue, setTabValue] = React.useState(0);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  const [rowData, setRowData] = React.useState<any>([]);
  React.useEffect(() => {
    const x = Object.entries(
      props.activeRow.ValidatedAddresses.SmartyStreets || {}
    ).map((e: any) => {
      return {
        id: uuidv4(),
        addressComponent: e[0],
        value: e[1],
      };
    });
    setRowData(x);
  }, []);

  const columns: GridColDef[] = [
    { field: "addressComponent", headerName: "Address Component", flex: 1 },
    { field: "value", headerName: "Value", flex: 1 },
  ];

  return (
    <Box sx={{ width: 800, height: 700, p: 4 }}>
      <Grid container sx={{ alignItems: "center" }}>
        {/* Header */}
        <Grid item container xs={12} sx={{ justifyContent: "space-between" }}>
          <Grid item xs={10}>
            <Typography>
              Owner: {props.activeRow.owner || ""} <br />
              ID: {props.activeRow.id || ""}
            </Typography>
          </Grid>
          <Grid item>
            <Tooltip title="Back">
              <IconButton onClick={props.handleDrawerClose}>
                <ExitToAppRoundedIcon color="primary" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Address Components" {...a11yProps(0)} />
              <Tab label="GeoJSON Data" {...a11yProps(1)} />
            </Tabs>
          </Box>
        </Grid>
      </Grid>

      {/* Address Components Tab */}
      <TabPanel value={tabValue} index={0}>
        <DataGrid rows={rowData} columns={columns} pageSize={30} />
      </TabPanel>

      {/* GeoJSON Data Tab */}
      <TabPanel value={tabValue} index={1}>
        <Provider store={keplerStore}>
          <GeoFrameTab
            activeRow={props.activeRow}
            rowData={props.rowData}
            activeRowId={props.activeRowId}
            setRowData={props.setRowData}
          />
        </Provider>
      </TabPanel>
    </Box>
  );
}
