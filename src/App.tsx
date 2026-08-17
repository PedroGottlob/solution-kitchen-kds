import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useKitchenOrders } from './hooks/useKitchenOrders'
import { OrderCard } from './components/kds/OrderCard'
import { KdsHeader } from './components/kds/KdsHeader'
import { kitchenSignalRService } from './services/kitchenSignalRService'
import { setTenantId as setKitchenServiceTenantId, setAuthTokenGetter } from './services/kitchenService'

const NAMESPACE = 'https://solution-kitchen.com'
const DEV_FALLBACK_TENANT_ID = '00000000-0000-0000-0000-000000000001'

function App() {
  const { isLoading, isAuthenticated, loginWithRedirect, logout, user, getAccessTokenSilently } = useAuth0()
  const { orders, connected, error, updateStatus } = useKitchenOrders()

  const pending = orders.filter(o => o.Status === 'Pending').length
  const preparing = orders.filter(o => o.Status === 'Preparing').length
  const ready = orders.filter(o => o.Status === 'Ready').length

  const roles: string[] = user?.[`${NAMESPACE}/roles`] ?? []
  const rawTenantId: string | undefined = user?.[`${NAMESPACE}/tenant_id`]
  const tenantId: string | undefined = rawTenantId ?? (import.meta.env.DEV ? DEV_FALLBACK_TENANT_ID : undefined)

  useEffect(() => {
    if (!isAuthenticated) return
    if (!roles.includes('chef') && !roles.includes('gerente')) return
    if (!tenantId) return

    kitchenSignalRService.setTenantId(tenantId)
    kitchenSignalRService.setAuthTokenGetter(() => getAccessTokenSilently())
    setKitchenServiceTenantId(tenantId)
    setAuthTokenGetter(() => getAccessTokenSilently())
    kitchenSignalRService.connect().catch(console.error)
  }, [isAuthenticated, tenantId, getAccessTokenSilently])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Carregando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-6 px-8">
        <div className="text-center flex flex-col items-center">
          <img src="/logo-lockup.svg" alt="Solution Kitchen" className="h-20 mb-4" />
          <p className="text-zinc-500 text-sm">KDS · Cozinha</p>
        </div>
        <button
          onClick={() => loginWithRedirect()}
          className="w-full max-w-xs py-3.5 rounded-xl bg-accent-600 text-white font-medium text-sm cursor-pointer hover:bg-accent-500 transition-colors"
        >
          Entrar
        </button>
      </div>
    )
  }

  if (!roles.includes('chef') && !roles.includes('gerente')) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-8">
        <div className="text-center">
          <p className="text-zinc-900 text-lg font-medium mb-2">Acesso negado</p>
          <p className="text-zinc-500 text-sm">Você não tem permissão para acessar o KDS.</p>
        </div>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-8">
        <div className="text-center">
          <p className="text-zinc-900 text-lg font-medium mb-2">Conta sem restaurante vinculado</p>
          <p className="text-zinc-500 text-sm">Sua conta não está associada a nenhum restaurante. Entre em contato com o suporte.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <KdsHeader
        pending={pending}
        preparing={preparing}
        ready={ready}
        connected={connected}
      />

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-red-700 text-sm">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <div className="text-zinc-500 text-5xl">🍳</div>
          <div className="text-zinc-500 text-lg">Nenhum pedido na fila</div>
          <div className="text-zinc-500 text-sm">Os pedidos aparecerão aqui em tempo real</div>
        </div>
      ) : (
        <div className="flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
          {orders.map(order => (
            <OrderCard
              key={order.OrderId}
              order={order}
              onUpdateStatus={updateStatus}
            />
          ))}
        </div>
      )}

      <div className="bg-accent-50 border-t border-accent-200 px-6 py-2 flex items-center justify-between">
        <span className="text-zinc-500 text-xs">
          {orders.length} pedido{orders.length !== 1 ? 's' : ''} na tela
        </span>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="text-zinc-500 text-xs hover:text-zinc-600 transition-colors cursor-pointer"
        >
          Sair
        </button>
      </div>
    </div>
  )
}

export default App