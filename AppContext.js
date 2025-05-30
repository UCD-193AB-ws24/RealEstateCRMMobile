// AppContext.js
import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [shouldRefreshHome, setShouldRefreshHome] = useState(false);
  const [shouldRefreshLeads, setShouldRefreshLeads] = useState(false);

  return (
    <AppContext.Provider value={{ shouldRefreshHome, setShouldRefreshHome, shouldRefreshLeads, setShouldRefreshLeads }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
