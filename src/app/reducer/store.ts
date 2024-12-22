import { configureStore, createSlice } from "@reduxjs/toolkit";

import { SingleShuttleSchedule } from "@/data";

interface Action{
    type: string,
    payload: SingleShuttleSchedule
}

const actions = createSlice({
    name: 'actions',
    initialState: [] as SingleShuttleSchedule[],
    reducers: {
        updateActions: (state, action: Action) => {
            if(state.length > 0){
                state.pop()
            }
            if(action.payload !== undefined){
                state.push(action.payload)
            }
        }
    }
})

export const store = configureStore({
    reducer: {
        actions: actions.reducer
    }
})

export const { updateActions } = actions.actions