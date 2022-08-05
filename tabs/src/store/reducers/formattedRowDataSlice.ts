import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: []
}

export const formattedRowDataSlice = createSlice({
  name: 'Formatted Row Data',
  initialState: initialState,
  reducers: {
    setFormattedRD: (state: any, input) => {
      console.log("Formatted Row Data has been set.")
      state.data = input.payload;
    },
    resetFormattedRD: (state: any) => {
      state.data = initialState
    },
  },
})

export const { setFormattedRD, resetFormattedRD } = formattedRowDataSlice.actions
export default formattedRowDataSlice.reducer;