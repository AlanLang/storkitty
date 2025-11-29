import { type AppInfo, getAppInfo } from "@/api/app";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

export function useIsWaitingAppInfo() {
  const value = useContext(AppContext);
  return value.appInfo === null;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value.appInfo) {
    throw new Error("App info not found");
  }
  return value.appInfo;
}

export function useSetAppInfo() {
  const { setAppInfo, appInfo } = useContext(AppContext);
  return (value: Omit<AppInfo, "version" | "initialed">) => {
    appInfo && setAppInfo({ ...appInfo, ...value, initialed: true });
  };
}

export function useSetInitialed() {
  const { setAppInfo, appInfo } = useContext(AppContext);
  return () => {
    appInfo && setAppInfo({ ...appInfo, initialed: true });
  };
}

const AppContext = createContext<{
  appInfo: AppInfo | null;
  setAppInfo: (appInfo: AppInfo | null) => void;
}>({
  appInfo: null,
  setAppInfo: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  const { data } = useQuery({
    queryKey: ["app", "info"],
    queryFn: getAppInfo,
    retry: false,
  });

  useEffect(() => {
    data && setAppInfo(data);
  }, [data]);

  return (
    <AppContext.Provider
      value={{
        appInfo,
        setAppInfo: setAppInfo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
