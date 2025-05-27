
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
      const storedSettings = localStorage.getItem("rs-timer-settings"); // Updated key prefix
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Merge with defaults to ensure all keys are present, especially new ones like customSoundscapeUrls
        setSettings(prev => ({ 
          ...DEFAULT_SETTINGS, 
          ...prev, // Keep existing values if any
          ...parsedSettings,
          customSoundscapeUrls: { // Ensure customSoundscapeUrls is an object
            ...(DEFAULT_SETTINGS.customSoundscapeUrls || {}),
            ...(parsedSettings.customSoundscapeUrls || {})
          } 
        }));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
      setSettings(DEFAULT_SETTINGS);
    }
    setIsSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (isSettingsLoaded) { 
        try {
            localStorage.setItem("rs-timer-settings", JSON.stringify(settings)); // Updated key prefix
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
