import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { tenantStore } from "./tenantStore";

const TENANT_KEY = "content-platform-application-id";

type TenantContextValue = {
  applicationId: string;
  setApplicationId: (value: string) => void;
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

type TenantProviderProps = {
  children: React.ReactNode;
  initialApplicationId?: string;
  persist?: boolean;
  storageKey?: string;
};

export const TenantProvider = ({
  children,
  initialApplicationId,
  persist = true,
  storageKey = TENANT_KEY
}: TenantProviderProps) => {
  const [applicationId, setApplicationIdState] = useState(() => {
    if (initialApplicationId !== undefined) {
      return initialApplicationId;
    }
    if (!persist) {
      return "";
    }
    return localStorage.getItem(storageKey) ?? "";
  });

  const setApplicationId = (value: string) => {
    setApplicationIdState(value);
    tenantStore.setApplicationId(value);
    if (persist) {
      localStorage.setItem(storageKey, value);
    }
  };

  const value = useMemo(
    () => ({ applicationId, setApplicationId }),
    [applicationId]
  );

  useEffect(() => {
    tenantStore.setApplicationId(applicationId);
  }, [applicationId]);

  useEffect(() => {
    if (initialApplicationId !== undefined) {
      setApplicationIdState(initialApplicationId);
      tenantStore.setApplicationId(initialApplicationId);
      if (persist) {
        localStorage.setItem(storageKey, initialApplicationId);
      }
    }
  }, [initialApplicationId, persist, storageKey]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
};
