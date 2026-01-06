import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import enUS from '@/locales/en-US.json'
import ptBR from '@/locales/pt-BR.json'
import { format } from 'date-fns'
import { ptBR as dateFnsPtBR, enUS as dateFnsEnUS } from 'date-fns/locale'

type Locale = 'pt-BR' | 'en-US'
type TranslationData = typeof ptBR

const translations: Record<Locale, TranslationData> = {
  'pt-BR': ptBR,
  'en-US': enUS,
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  formatDate: (date: Date | string | number, formatStr?: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  // Default to pt-BR as per requirement, but check persistence
  const [locale, setLocaleState] = useState<Locale>('pt-BR')

  useEffect(() => {
    // 1. Check local storage first (guest or remembered preference)
    const stored = localStorage.getItem('app-language') as Locale
    if (stored && (stored === 'pt-BR' || stored === 'en-US')) {
      setLocaleState(stored)
      return
    }

    // 2. Check browser language
    const browserLang = navigator.language
    if (browserLang.includes('en')) {
      setLocaleState('en-US')
    } else {
      setLocaleState('pt-BR') // Default fallback
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('app-language', newLocale)
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = translations[locale]
    
    // Traverse current locale
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as any)[k]
      } else {
        value = undefined
        break
      }
    }

    // Fallback to pt-BR if missing
    if (value === undefined && locale !== 'pt-BR') {
      let fallbackValue: any = translations['pt-BR']
      for (const k of keys) {
        if (fallbackValue && typeof fallbackValue === 'object' && k in fallbackValue) {
          fallbackValue = (fallbackValue as any)[k]
        } else {
          fallbackValue = undefined
          break
        }
      }
      value = fallbackValue
    }

    if (typeof value !== 'string') {
      return key // Return key if not found or if it's an object
    }

    // Replace params
    if (params) {
      return Object.entries(params).reduce((acc, [key, val]) => {
        return acc.replace(new RegExp(`{${key}}`, 'g'), String(val))
      }, value)
    }

    return value
  }

  const formatDate = (date: Date | string | number, formatStr: string = 'P') => {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return 'Invalid Date'
    
    return format(dateObj, formatStr, {
      locale: locale === 'pt-BR' ? dateFnsPtBR : dateFnsEnUS
    })
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, formatDate }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
