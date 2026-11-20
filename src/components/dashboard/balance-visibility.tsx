"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type BalanceVisibilityContextValue = {
  visible: boolean;
  toggle: () => void;
  setVisible: (value: boolean) => void;
};

const BalanceVisibilityContext = createContext<BalanceVisibilityContextValue | null>(null);

export function BalanceVisibilityProvider({ children }: { children: ReactNode }) {
  // Privacy-oriented default: balances hidden until explicitly revealed.
  const [visible, setVisible] = useState(false);
  const value = useMemo(
    () => ({
      visible,
      toggle: () => setVisible((v) => !v),
      setVisible,
    }),
    [visible],
  );
  return (
    <BalanceVisibilityContext.Provider value={value}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility() {
  const ctx = useContext(BalanceVisibilityContext);
  if (!ctx) {
    throw new Error("useBalanceVisibility must be used within BalanceVisibilityProvider");
  }
  return ctx;
}
