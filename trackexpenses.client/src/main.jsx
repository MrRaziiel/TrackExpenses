import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './components/Theme/Theme.jsx';
import { LanguageProvider } from './utilis/Translate/LanguageContext.jsx'
import { AuthProvider } from './components/Authentication/AuthContext.jsx';

import GlobalStyles from './components/Theme/GlobalStyle.jsx';
import App from './App.jsx';
import './index.css';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <GlobalStyles />
        <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>
);