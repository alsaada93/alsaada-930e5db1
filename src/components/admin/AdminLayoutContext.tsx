import { createContext, useContext, useState, type ReactNode } from "react";

interface AdminLayoutValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const AdminLayoutContext = createContext<AdminLayoutValue | undefined>(undefined);

export function AdminLayoutProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <AdminLayoutContext.Provider
      value={{ collapsed, toggleCollapsed: () => setCollapsed((c) => !c) }}
    >
      {children}
    </AdminLayoutContext.Provider>
  );
}

export function useAdminLayout() {
  const ctx = useContext(AdminLayoutContext);
  if (!ctx) throw new Error("useAdminLayout must be used within AdminLayoutProvider");
  return ctx;
}
