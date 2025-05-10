import React from 'react';
import { Moon, Sun, Bell, Globe, Lock, CreditCard, PaintBucket } from 'lucide-react';
import { useTheme } from '../Theme/Theme';
import { useLanguage } from '../../utilis/Translate/LanguageContext';

function Settings() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Português' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
        {t('common.settings')}
      </h1>

      <div className="bg-white rounded-xl shadow-md" style={{ backgroundColor: theme.colors.background.paper }}>
        {/* Appearance */}
        <div className="p-6 border-b" style={{ borderColor: theme.colors.secondary.light }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
            {t('settings.appearance')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isDarkMode ? (
                  <Moon className="h-5 w-5" style={{ color: theme.colors.text.secondary }} />
                ) : (
                  <Sun className="h-5 w-5" style={{ color: theme.colors.text.secondary }} />
                )}
                <span style={{ color: theme.colors.text.primary }}>{t('settings.themeMode')}</span>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: theme.colors.primary.main,
                  color: theme.colors.background.paper
                }}
              >
                {isDarkMode ? t('settings.light') : t('settings.dark')}
              </button>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="p-6 border-b" style={{ borderColor: theme.colors.secondary.light }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
            {t('settings.preferences')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5" style={{ color: theme.colors.text.secondary }} />
                <span style={{ color: theme.colors.text.primary }}>{t('settings.language')}</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                style={{
                  backgroundColor: theme.colors.background.paper,
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.secondary.light
                }}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;