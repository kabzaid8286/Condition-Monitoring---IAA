import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AssetProvider } from './contexts/AssetContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AssetProvider>
      <App />
    </AssetProvider>
  </StrictMode>,
)
