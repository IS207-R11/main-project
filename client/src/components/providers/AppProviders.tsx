"use client";

import React, { createContext, useContext, useState } from "react";
import { TimeThemeProvider } from "@/context/TimeThemeContext";
import { SavedFoodsProvider } from "@/context/SavedFoodsContext";
import { SavedSheet } from "@/components/saved/SavedSheet";

import { AuthProvider } from "@/context/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";

interface SavedSheetContextType {
  openSaved: () => void;
  closeSaved: () => void;
}

const SavedSheetContext = createContext<SavedSheetContextType>({
  openSaved: () => {},
  closeSaved: () => {},
});

export const useSavedSheet = () => useContext(SavedSheetContext);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [savedOpen, setSavedOpen] = useState(false);

  return (
    <AuthProvider>
      <TimeThemeProvider>
        <SavedFoodsProvider>
          <SavedSheetContext.Provider
            value={{
              openSaved: () => setSavedOpen(true),
              closeSaved: () => setSavedOpen(false),
            }}
          >
            {children}
            <SavedSheet open={savedOpen} onOpenChange={setSavedOpen} />
            <AuthDialog />
          </SavedSheetContext.Provider>
        </SavedFoodsProvider>
      </TimeThemeProvider>
    </AuthProvider>
  );
}
