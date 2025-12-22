import React, { createContext, useContext, useMemo, useState } from "react";

const TENANT_KEY = "content-platform-application-id";

type TenantContextValue = {
  applicationId: string;
  setApplicationId: (value: string) => void;
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const [applicationId, setApplicationIdState] = useState(
    localStorage.getItem(TENANT_KEY) ?? ""
  );

  const setApplicationId = (value: string) => {
    setApplicationIdState(value);
    localStorage.setItem(TENANT_KEY, value);
  };

  const value = useMemo(
    () => ({ applicationId, setApplicationId }),
    [applicationId]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
};
