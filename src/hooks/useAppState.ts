import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

export const useAppState = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}; 