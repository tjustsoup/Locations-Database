import React from "react";
import { IconButton, TextField } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { TeamsFxContext } from "./Context";
import axios from "axios";
import { useData } from "@microsoft/teamsfx-react";

// ln 51 set to "console.log", waiting on API

export default function SearchBar(props: any) {
  const { teamsfx } = React.useContext(TeamsFxContext);
  const [textValue, setTextValue] = React.useState("");
  const handleTextValueChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTextValue(event.target.value);
  };

  // I don't think I need to do a GET request beforehand for the rowCount
  // DataGrid should be okay with setting rowData to a .length() bigger than 100
  const ownerSearchRequest = useData(
    async () => {
      if (teamsfx) {
        const accessToken = await teamsfx
          .getCredential()
          .getToken([".default"]);
        const response = await axios({
          method: "post",
          url: process.env.REACT_APP_API_ENDPOINT as string,
          data: {
            owner: textValue,
          },
          headers: {
            authorization: "Bearer " + accessToken?.token || "",
          },
        });
        console.log(response);
        props.setRowData(response.data);
      }
    },
    { autoLoad: false }
  );

  return (
    <div>
      <TextField
        variant="standard"
        value={textValue}
        label="Search by Owner"
        onChange={handleTextValueChange}
        sx={{ width: 400 }}
      />
      <IconButton onClick={() => console.log('ownerSearchRequest.reload')}>
        <SendRoundedIcon color="primary" />
      </IconButton>
    </div>
  );
}
