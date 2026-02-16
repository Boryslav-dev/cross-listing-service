import { useCallback, useEffect, useMemo, useState } from 'react'
import { setRequestLocale } from '../api/http'
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  dictionaries,
} from './dictionaries'
import { I18nContext } from './I18nContext'

const STORAGE_KEY = 'app_locale'

function normalizeLocale(value) {
  if (!value || typeof value !== 'string') {
    return null
  }

  const clean = value.trim().toLowerCase().replace('_', '-')

  if (!clean) {
    return null
  }

  return clean.split('-')[0]
}

function getInitialLocale() {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }

  const fromStorage = normalizeLocale(window.localStorage.getItem(STORAGE_KEY))
  if (fromStorage && SUPPORTED_LOCALES.includes(fromStorage)) {
    return fromStorage
  }

  const browserLocales = Array.isArray(window.navigator.languages)
    ? window.navigator.languages
    : [window.navigator.language]

  for (const localeCandidate of browserLocales) {
    const normalized = normalizeLocale(localeCandidate)
    if (normalized && SUPPORTED_LOCALES.includes(normalized)) {
      return normalized
    }
  }

  return DEFAULT_LOCALE
}

function getValueByPath(dictionary, key) {
  return key.split('.').reduce((acc, segment) => {
    if (!acc || typeof acc !== 'object') {
      return undefined
    }

    return acc[segment]
  }, dictionary)
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const initialLocale = getInitialLocale()
    setRequestLocale(initialLocale)

    return initialLocale
  })

  useEffect(() => {
    setRequestLocale(locale)
    document.documentElement.lang = locale
    document.title = getValueByPath(dictionaries[locale], 'app.name') ?? 'App'
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const changeLocale = useCallback((nextLocale) => {
    const normalizedLocale = normalizeLocale(nextLocale)

    if (!normalizedLocale || !SUPPORTED_LOCALES.includes(normalizedLocale)) {
      return
    }

    setLocale(normalizedLocale)
  }, [])

  const t = useCallback(
    (key, params = {}) => {
      const activeDictionary = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]
      const fallbackDictionary = dictionaries[DEFAULT_LOCALE]

      const value =
        getValueByPath(activeDictionary, key) ??
        getValueByPath(fallbackDictionary, key)

      if (typeof value !== 'string') {
        return key
      }

      return Object.entries(params).reduce((result, [paramName, paramValue]) => {
        const safeValue = String(paramValue)

        return result.replaceAll(`{${paramName}}`, safeValue)
      }, value)
    },
    [locale],
  )

  const contextValue = useMemo(
    () => ({
      locale,
      supportedLocales: SUPPORTED_LOCALES,
      setLocale: changeLocale,
      t,
    }),
    [changeLocale, locale, t],
  )

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  )
}
