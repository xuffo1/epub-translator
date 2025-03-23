import React, { createContext, useReducer, useContext } from 'react';
import { DEFAULT_READER_SETTINGS } from '../types';

interface AppState {
  selectedBook: File | null;
  translateError: string | null;
  readerSettings: ReaderSettingsType;
  isLoading: boolean;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

type AppAction =
  | { type: 'SET_SELECTED_BOOK'; payload: File | null }
  | { type: 'SET_TRANSLATE_ERROR'; payload: string | null }
  | { type: 'SET_READER_SETTINGS'; payload: ReaderSettingsType }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  selectedBook: null,
  translateError: null,
  readerSettings: DEFAULT_READER_SETTINGS,
  isLoading: false
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_SELECTED_BOOK':
      return { ...state, selectedBook: action.payload };
    case 'SET_TRANSLATE_ERROR':
      return { ...state, translateError: action.payload };
    case 'SET_READER_SETTINGS':
      return { ...state, readerSettings: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}; 