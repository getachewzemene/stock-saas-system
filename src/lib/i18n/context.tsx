"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from './translations';

type Language = 'en' | 'am' | 'om';
type TranslationKey = string;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  tWithParams: (key: TranslationKey, params: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => current?.[key], obj) || path;
  };

  const t = (key: TranslationKey): string => {
    return getNestedValue(translations[language], key) || getNestedValue(translations.en, key) || key;
  };

  const tWithParams = (key: TranslationKey, params: Record<string, string>): string => {
    let text = t(key);
    
    // Replace parameters in the format {paramName}
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), value);
    });
    
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, tWithParams }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}