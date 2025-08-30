import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const lightTheme = {
  colors: {
    primary: {
      main: '#2563EB',   // azul moderno (blue-600)
      light: '#60A5FA',  // azul suave (blue-400)
      dark: '#1E40AF',   // azul profundo (blue-900)
    },
    secondary: {
      main: '#6B7280',   // cinza médio
      light: '#E5E7EB',  // cinza claro
      dark: '#374151',   // cinza escuro
    },
    background: {
      default: '#F8FAFC', // slate-50
      paper: '#FFFFFF',   // branco puro
    },
    text: {
      primary: '#0F172A',   // slate-900
      secondary: '#475569', // slate-600
    },
    success: {
      main: '#16A34A',  // verde confiável (green-600)
      light: '#DCFCE7', // verde claro (green-100)
    },
    error: {
      main: '#DC2626',  // vermelho forte (red-600)
      light: '#FEE2E2', // vermelho claro (red-100)
    },

    // já existente no teu light
    menu: {
      bg: '#F1F5F9',        // slate-100
      border: '#E2E8F0',    // slate-200
      text: '#1E293B',      // slate-800
      muted: '#64748B',     // slate-500
      hoverBg: '#E0F2FE',   // sky-100
      activeBg: '#DBEAFE',  // blue-100
      activeText: '#1D4ED8' // blue-700
    }
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  }
};


const darkTheme = {
  colors: {
    primary: {
      main: '#60A5FA',
      light: '#93C5FD',
      dark: '#2563EB',
    },
    secondary: {
      main: '#9CA3AF',
      light: '#4B5563',
      dark: '#1F2937',
    },
    background: {
      default: '#111827',
      paper: '#1F2937',
    },

    // ⬇️ acrescentado (sidebar/menu no modo escuro)
    menu: {
      bg: '#0F172A',         // slate-900 (ligeiramente distinto do paper)
      border: '#1F2937',     // slate-800
      text: '#E5E7EB',       // gray-200
      muted: '#94A3B8',      // slate-400
      hoverBg: '#1B2431',    // entre slate-900 e 800
      activeBg: '#1E293B',   // slate-800
      activeText: '#93C5FD', // blue-300
      ring: 'rgba(96,165,250,0.35)' // foco acessível (blue-400 @ 35%)
    },

    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
    },
    success: {
      main: '#34D399',
      light: '#064E3B',
    },
    error: {
      main: '#F87171',
      light: '#7F1D1D',
    }
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  }
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