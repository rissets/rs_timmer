
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
    let loadedSettings: Partial<Settings> = {};
    try {
      const storedSettingsString = localStorage.getItem("rs-timer-settings");
      if (storedSettingsString) {
        try {
            loadedSettings = JSON.parse(storedSettingsString);
        } catch (e) {
            console.error("Error parsing settings from localStorage:", e);
            // Keep loadedSettings empty, defaults will apply
        }
      }

      // Sanitize specific problematic fields that should be string | undefined
      if (loadedSettings.soundscapeWork === null) {
        loadedSettings.soundscapeWork = undefined;
      }
      if (loadedSettings.soundscapeBreak === null) {
        loadedSettings.soundscapeBreak = undefined;
      }
      if (loadedSettings.customSoundscapeUrls === null) {
        loadedSettings.customSoundscapeUrls = undefined; // Or {} if it should always be an object
      }
       if (loadedSettings.backgroundAnimation === null) {
        loadedSettings.backgroundAnimation = undefined;
      }


      // Merge with defaults: DEFAULT_SETTINGS provides base, loadedSettings overrides
      // Ensure customSoundscapeUrls is always at least an empty object if not defined.
      const finalSettings = {
        ...DEFAULT_SETTINGS,
        ...loadedSettings,
        customSoundscapeUrls: {
          ...DEFAULT_SETTINGS.customSoundscapeUrls, // Ensure defaults for customSoundscapeUrls are there
          ...(loadedSettings.customSoundscapeUrls || {}), // Spread user's custom URLs, or empty if none
        },
      };
      
      setSettings(finalSettings);

    } catch (error) { // Catch errors from localStorage.getItem or broader issues
      console.error("Failed to load settings from localStorage:", error);
      setSettings(DEFAULT_SETTINGS); // Fallback to absolute defaults on any error
    }
    setIsSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (isSettingsLoaded) { 
        try {
            localStorage.setItem("rs-timer-settings", JSON.stringify(settings));
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
