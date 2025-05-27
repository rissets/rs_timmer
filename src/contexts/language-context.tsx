
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Language = 'en' | 'id';

interface LanguageContextProps {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
  translations: Record<string, string>; // Expose translations for dynamic lists
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Helper to deeply access nested keys like 'a.b.c'
const getNestedTranslation = (obj: any, path: string): string | undefined => {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
};


export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Record<string, any>>({});

  useEffect(() => {
    const storedLang = localStorage.getItem('rs-timer-language') as Language | null;
    if (storedLang) {
      setLanguageState(storedLang);
    }
  }, []);

  useEffect(() => {
    async function loadTranslations() {
      try {
        const langModule = await import(`@/locales/${language}.json`);
        setTranslations(langModule.default);
      } catch (error) {
        console.error(`Could not load translations for ${language}:`, error);
        // Fallback to English if current language file fails
        if (language !== 'en') {
          const enModule = await import(`@/locales/en.json`);
          setTranslations(enModule.default);
        }
      }
    }
    loadTranslations();
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('rs-timer-language', lang);
  };

  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
    let translation = getNestedTranslation(translations, key) || key;
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(`{{${placeholder}}}`, replacements[placeholder]);
      });
    }
    return translation;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguageContext must be used within a LanguageProvider");
  }
  return context;
}
