// https://fluentsite.z22.web.core.windows.net/quick-start
import React from "react";
import { HashRouter as Router, Redirect, Route } from "react-router-dom";
import { useData, useTeamsFx } from "@microsoft/teamsfx-react";
import Tab from "./Tab";
import "./App.css";
import TabConfig from "./TabConfig";
import { TeamsFxContext } from "./Context";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  CircularProgress,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import axios from "axios";
import { setPermissions } from "../store/reducers/permissionsSlice";

const esqTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#F15A2B",
    },
    secondary: {
      main: "#FFFFFF"
    }
  },
});

export default function App() {
  const dispatch = useDispatch();
  const { loading, teamsfx, theme, themeString } = useTeamsFx();

  // #1 - getUserInfo
  const userInfo = useData(async () => {
    if (teamsfx) {
      const res = await teamsfx.getUserInfo();
      if (!res.displayName) {
        console.log("Reloading teamsfxLogin");
        teamsfxLogin.reload();
      } else {
        console.log("Reloading permissionsRequest");
        permissionsRequest.reload();
      }
    }
  });

  // #2a - Login
  const teamsfxLogin = useData(async () => {
    if (teamsfx) {
      console.log("Logging in...");
      const res = await teamsfx.login([".default"]);
      console.log(res);
      permissionsRequest.reload();
    }
  });

  // #2b - Get Permissions
  const permissionsRequest = useData(async () => {
    if (teamsfx) {
      console.log("Loading perm req...")
      const accessToken = await teamsfx.getCredential().getToken([".default"]);
      const res = await axios({
        method: "post",
        url: "https://esquire-rbac.azurewebsites.net/api/can?code=f44enH4u6Pst0aKsGXgkFMU1WpFNn6eL1C9lzlp0e4h_AzFuEvWF_w%3D%3D",
        data: {
          perms: [
            {
              domain: "locations",
              permission: "create",
            },
            {
              domain: "locations",
              permission: "read",
            },
            {
              domain: "locations",
              permission: "update",
            },
            {
              domain: "locations",
              permission: "delete",
            }
          ],
        },
        headers: {
          authorization: "Bearer " + accessToken?.token || "",
        },
      });
      console.log(res);
      return res;
    }
  });

  // After teamsfx is defined, check for userInfo
  React.useEffect(() => {
    if (teamsfx && !loading) {
      userInfo.reload();
    }
  }, [teamsfx, loading]);

  // After permissionsRequest returns, send the Data to the Store
  React.useEffect(() => {
    if (permissionsRequest.data && !permissionsRequest.loading) {
      dispatch(setPermissions(permissionsRequest.data.data));
    }
  }, [permissionsRequest.data, permissionsRequest.loading]);

  const store = useSelector((state: any) => state);

  return (
    <TeamsFxContext.Provider value={{ themeString, theme, teamsfx }}>
      <ThemeProvider theme={esqTheme}>
        <Router>
          <Route exact path="/">
            <Redirect to="/tab" />
          </Route>
          {teamsfxLogin.loading ||
          permissionsRequest.loading ||
          store.permissions.data.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <>
              <Route exact path="/tab" component={Tab} />
              <Route exact path="/config" component={TabConfig} />
            </>
          )}
        </Router>
      </ThemeProvider>
    </TeamsFxContext.Provider>
  );
}
