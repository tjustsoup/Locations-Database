import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: []
}

export const smartyDataSlice = createSlice({
  name: 'Smarty Data',
  initialState: initialState,
  reducers: {
    setData: (state: any, input) => {
      state.data = input.payload;
    },
    resetData: (state: any) => {
      state.data = initialState
    }
  },
})

export const { setData, resetData } = smartyDataSlice.actions
export default smartyDataSlice.reducer;