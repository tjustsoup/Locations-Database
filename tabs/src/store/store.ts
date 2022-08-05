import { configureStore } from "@reduxjs/toolkit";
import smartyDataReducer from "./reducers/smartyDataSlice";
import formattedRowDataReducer from "./reducers/formattedRowDataSlice";
import permissionsReducer from "./reducers/permissionsSlice";

export default configureStore({
  reducer: {
    smartyData: smartyDataReducer,
    formattedRowData: formattedRowDataReducer,
    permissions: permissionsReducer,
  }
});