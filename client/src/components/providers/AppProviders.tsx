"use client";

import React from "react";
import { ToastContainer, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TimeThemeProvider } from "@/context/TimeThemeContext";
import { GameSettingsProvider } from "@/context/GameSettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TimeThemeProvider>
        <GameSettingsProvider>
          {children}
          <AuthDialog />
            <ToastContainer
              position="top-center"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick={false}
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              transition={Flip}
            />
          </GameSettingsProvider>
        </TimeThemeProvider>
      </AuthProvider>
    );
  }
