import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const lightTheme = {
  colors: {
    primary: {
      main: '#2563EB',   
      light: '#60A5FA', 
      dark: '#1E40AF',   
    },
    secondary: {
      main: '#6B7280',
      light: '#E5E7EB',
      dark: '#374151',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',   
    },
    menu: {
      bg: '#F1F5F9',
      border: '#E2E8F0',
      text: '#1E293B',
      muted: '#64748B',
      hoverBg: '#E0F2FE',
      activeBg: '#DBEAFE',
      activeText: '#1D4ED8',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
    success: {
      main: '#16A34A',
      light: '#DCFCE7',
    },
    error: {
      main: '#DC2626',
      light: '#FEE2E2',
    },
    card: {
      bg: '#FFFFFF',
      border: '#E2E8F0',
      shadow: 'rgba(0, 0, 0, 0.05)',
    },
    input: {
      bg: '#FFFFFF',
      border: '#CBD5E1',
      focus: '#2563EB',
      placeholder: '#94A3B8',
    },
    button: {
      primary: {
        bg: '#2563EB',
        hover: '#1D4ED8',
        text: '#FFFFFF',
      },
      secondary: {
        bg: '#F1F5F9',
        hover: '#E2E8F0',
        text: '#1E293B',
      },
    },
  },
};

const darkTheme = {
  colors: {
    primary: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#1E40AF',
    },
    secondary: {
      main: '#9CA3AF',
      light: '#4B5563',
      dark: '#1F2937',
    },
    background: {
      default: '#0F172A', 
      paper: '#1E293B',   
    },
    menu: {
      bg: '#1E293B',
      border: '#334155',
      text: '#E2E8F0',
      muted: '#94A3B8',
      hoverBg: '#1E3A8A',
      activeBg: '#1E40AF',
      activeText: '#60A5FA',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#94A3B8',
    },
    success: {
      main: '#22C55E',
      light: '#14532D',
    },
    error: {
      main: '#F87171',
      light: '#7F1D1D',
    },
    card: {
      bg: '#1E293B',
      border: '#334155',
      shadow: 'rgba(0,0,0,0.4)',
    },
    input: {
      bg: '#0F172A',
      border: '#334155',
      focus: '#3B82F6',
      placeholder: '#64748B',
    },
    button: {
      primary: {
        bg: '#3B82F6',
        hover: '#2563EB',
        text: '#F9FAFB',
      },
      secondary: {
        bg: '#334155',
        hover: '#475569',
        text: '#E2E8F0',
      },
    },
  },
};





export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}