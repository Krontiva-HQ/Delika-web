import { useEffect } from 'react';
import i18n from '../i18n/i18n';
import dayjs from 'dayjs';

/**
 * Hook to listen for language changes and update related libraries
 * This ensures that date formatting, calendar localization, and other
 * internationalization features stay in sync with the selected language
 */
export const useLanguageChange = () => {
  useEffect(() => {
    // Set dayjs locale whenever i18n language changes
    const handleLanguageChange = (lng: string) => {
      dayjs.locale(lng);
    };

    // Set initial dayjs locale
    dayjs.locale(i18n.language);

    // Add event listener
    i18n.on('languageChanged', handleLanguageChange);

    // Clean up
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return {
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage
  };
};

export default useLanguageChange; 