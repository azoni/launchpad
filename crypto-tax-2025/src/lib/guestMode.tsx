import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface GuestModeCtx {
  isGuest: boolean;
  enterGuest: () => void;
  exitGuest: () => void;
}

const GuestModeContext = createContext<GuestModeCtx>({
  isGuest: false,
  enterGuest: () => {},
  exitGuest: () => {},
});

export function GuestModeProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(
    () => sessionStorage.getItem("guest_mode") === "1"
  );

  function enterGuest() {
    sessionStorage.setItem("guest_mode", "1");
    setIsGuest(true);
  }

  function exitGuest() {
    sessionStorage.removeItem("guest_mode");
    // Clear guest data
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("ct25_"));
    for (const k of keys) localStorage.removeItem(k);
    setIsGuest(false);
  }

  return (
    <GuestModeContext.Provider value={{ isGuest, enterGuest, exitGuest }}>
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  const ctx = useContext(GuestModeContext);
  // Keep the module-level flag in sync so data/* functions can check it
  // without needing React context.
  useEffect(() => {
    _guestFlag = ctx.isGuest;
  }, [ctx.isGuest]);
  return ctx;
}

// Module-level flag readable from non-React code (data layer).
// Kept in sync by useGuestMode() above.
let _guestFlag = sessionStorage.getItem("guest_mode") === "1";

export function isGuestMode(): boolean {
  return _guestFlag;
}
