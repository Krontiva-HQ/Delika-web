import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/fr';
import 'dayjs/locale/es';

import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import esTranslation from './locales/es/translation.json';

// the translations
const resources = {
  en: {
    translation: enTranslation
  },
  fr: {
    translation: frTranslation
  },
  es: {
    translation: esTranslation
  }
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: {
      useSuspense: false, // prevents issues with server-side rendering
    }
  });

// Set dayjs locale whenever i18n language changes
i18n.on('languageChanged', (lng) => {
  dayjs.locale(lng);
});

// Set initial dayjs locale
dayjs.locale(i18n.language);

/**
 * Format a date according to the current language
 * @param date The date to format
 * @param format The format to use
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date | number, format: string = 'DD MMMM YYYY'): string => {
  return dayjs(date).format(format);
};

/**
 * Format a month name according to the current language
 * @param month Month name or number (0-11)
 * @param format 'long' for full name, 'short' for abbreviated
 * @returns Localized month name
 */
export const formatMonth = (month: string | number, format: 'long' | 'short' = 'long'): string => {
  let monthName = '';
  
  if (typeof month === 'number') {
    // If month is a number (0-11), convert to month name
    const date = dayjs().month(month);
    monthName = format === 'long' 
      ? date.format('MMMM') 
      : date.format('MMM');
  } else {
    // If month is already a string, use translation directly
    const key = `overview.months.${month}`;
    const shortKey = `overview.months.${month.substring(0, 3)}`;
    
    monthName = format === 'long'
      ? (i18n.exists(key) ? i18n.t(key) : month)
      : (i18n.exists(shortKey) ? i18n.t(shortKey) : month.substring(0, 3));
  }
  
  return monthName;
};

/**
 * Translate order status to the current language
 * @param status The status key to translate
 * @returns Translated status
 */
export const translateOrderStatus = (status: string): string => {
  if (!status) return i18n.t('orders.statuses.noStatus');
  
  // Normalize status to match translation keys
  const normalizedStatus = status
    .replace(/\s+/g, '') // Remove spaces
    .replace(/^[A-Z]/, match => match.toLowerCase()); // First letter lowercase
  
  const key = `orders.statuses.${normalizedStatus}`;
  
  if (i18n.exists(key)) {
    return i18n.t(key);
  }
  
  // If no translation found, format the status for display
  return status.replace(/([A-Z])/g, ' $1')
    .replace(/^./, match => match.toUpperCase());
};

/**
 * Translate kitchen status to the current language
 * @param status The kitchen status key to translate
 * @returns Translated kitchen status
 */
export const translateKitchenStatus = (status: string): string => {
  if (!status) return i18n.t('orders.kitchenStatuses.notStarted', 'Not Started');
  
  // Direct mapping for exact status matches
  const statusMap: Record<string, string> = {
    'orderReceived': 'orders.kitchenStatuses.orderReceived',
    'preparing': 'orders.kitchenStatuses.preparing',
    'prepared': 'orders.kitchenStatuses.prepared',
    'cancelled': 'orders.kitchenStatuses.cancelled',
    'notStarted': 'orders.kitchenStatuses.notStarted',
    '': 'orders.kitchenStatuses.notStarted'
  };
  
  // Check if we have a direct mapping
  if (statusMap[status]) {
    return i18n.t(statusMap[status]);
  }
  
  // Fallback translations for common kitchen statuses
  const fallbacks: Record<string, string> = {
    'orderReceived': 'Order Received',
    'preparing': 'Preparing',
    'prepared': 'Prepared',
    'cancelled': 'Cancelled',
    '': 'Not Started'
  };
  
  return fallbacks[status] || status.replace(/([A-Z])/g, ' $1')
    .replace(/^./, match => match.toUpperCase());
};

export default i18n; 