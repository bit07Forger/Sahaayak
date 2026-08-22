import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { AccessibilityProvider } from './contexts/AccessibilityContext'

import { LanguageProvider } from './contexts/LanguageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AccessibilityProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </AccessibilityProvider>
    </AuthProvider>
  </StrictMode>,
)
