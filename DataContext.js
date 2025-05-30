import React, { createContext, useState, useContext } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [statsChanged, setStatsChanged] = useState(false);
  const [updatedLeadId, setUpdatedLeadId] = useState(null);

  const markStatsChanged = () => setStatsChanged(true);
  const markLeadUpdated = (id) => setUpdatedLeadId(id);

  const clearFlags = () => {
    setStatsChanged(false);
    setUpdatedLeadId(null);
  };

  return (
    <DataContext.Provider value={{ statsChanged, updatedLeadId, markStatsChanged, markLeadUpdated, clearFlags }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => useContext(DataContext);
