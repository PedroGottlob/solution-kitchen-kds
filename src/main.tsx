import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.tsx'
import { kitchenSignalRService } from './services/kitchenSignalRService'
import {
  applyBranding,
  cacheBranding,
  defaultBranding,
  getCachedBranding,
  loadBranding,
  type TenantBranding,
} from './services/brandingService'

const host = window.location.host

// Branding inicial: último conhecido deste host ou o padrão. O app renderiza
// imediatamente com ele; a resposta real do backend só atualiza a marca
// depois, sem bloquear a primeira pintura.
const initialBranding: TenantBranding = getCachedBranding(host) ?? defaultBranding

applyBranding(initialBranding)
kitchenSignalRService.connect().catch(console.error)

function Root() {
  const [branding, setBranding] = useState<TenantBranding>(initialBranding)

  useEffect(() => {
    let cancelled = false
    loadBranding(host).then((fresh) => {
      // loadBranding devolve defaultBranding em caso de erro/timeout: nesse
      // caso mantém o que já está na tela (e no cache) em vez de sobrescrever.
      if (cancelled || fresh === defaultBranding) return
      cacheBranding(host, fresh)
      applyBranding(fresh)
      setBranding(fresh)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      cacheLocation="localstorage"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
    >
      <App branding={branding} />
    </Auth0Provider>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
