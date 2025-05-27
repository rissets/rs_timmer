
"use client";

import type { Settings } from '@/lib/types';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from '@/lib/constants';

interface SettingsContextProps {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  isSettingsLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem("zenith-timer-settings");
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Merge with defaults to ensure all keys are present if new settings are added
        // and to apply new default values for settings not previously stored
        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, ...parsedSettings }));
      } else {
        // If no stored settings, initialize with defaults
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
      // Fallback to default settings if parsing fails
      setSettings(DEFAULT_SETTINGS);
    }
    setIsSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (isSettingsLoaded) { // Only save after initial load to prevent overwriting with defaults
        try {
            localStorage.setItem("zenith-timer-settings", JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage:", error);
        }
    }
  }, [settings, isSettingsLoaded]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, isSettingsLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettingsContext must be used within a SettingsProvider");
  }
  return context;
}
