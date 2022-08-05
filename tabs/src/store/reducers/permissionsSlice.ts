import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: []
}

export const permissionsSlice = createSlice({
  name: 'Permissions',
  initialState: initialState,
  reducers: {
    setPermissions: (state: any, input) => {
      state.data = input.payload;
    },
    resetPermissions: (state: any) => {
      state.data = initialState
    }
  },
})

export const { setPermissions, resetPermissions } = permissionsSlice.actions
export default permissionsSlice.reducer;