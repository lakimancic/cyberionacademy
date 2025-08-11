import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { NotificationProvider } from './contexts/Notification/NotificationProvider.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <NotificationProvider>
            <App />
        </NotificationProvider>
    </StrictMode>
)
