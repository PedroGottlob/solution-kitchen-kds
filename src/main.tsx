import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.tsx'
import { kitchenSignalRService } from './services/kitchenSignalRService'
import { applyBranding, loadBranding } from './services/brandingService'

async function bootstrap() {
  const branding = await loadBranding(window.location.host)
  applyBranding(branding)

  kitchenSignalRService.connect().catch(console.error)

  createRoot(document.getElementById('root')!).render(
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
    >
      <App branding={branding} />
    </Auth0Provider>
  )
}

void bootstrap()