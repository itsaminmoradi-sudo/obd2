import React, { createContext, useReducer } from 'react';

export const OBDContext = createContext();

const initialState = {
  connected: false,
  device: null,
  ecu: null,
  pids: [],
  dtcs: [],
  liveData: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'SET_DEVICE':
      return { ...state, device: action.payload };
    case 'SET_ECU':
      return { ...state, ecu: action.payload };
    case 'SET_PIDS':
      return { ...state, pids: action.payload };
    case 'SET_DTCS':
      return { ...state, dtcs: action.payload };
    case 'SET_LIVE_DATA':
      return { ...state, liveData: action.payload };
    default:
      return state;
  }
}

export function OBDProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <OBDContext.Provider value={{ state, dispatch }}>
      {children}
    </OBDContext.Provider>
  );
}
