import { useAuth0 } from '@auth0/auth0-react'
import { useKitchenOrders } from './hooks/useKitchenOrders'
import { OrderCard } from './components/kds/OrderCard'
import { KdsHeader } from './components/kds/KdsHeader'

function App() {
  const { isLoading, isAuthenticated, loginWithRedirect, logout } = useAuth0()
  const { orders, connected, error, updateStatus } = useKitchenOrders()

  const pending = orders.filter(o => o.Status === 'Pending').length
  const preparing = orders.filter(o => o.Status === 'Preparing').length
  const ready = orders.filter(o => o.Status === 'Ready').length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Carregando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 px-8">
        <div className="text-center">
          <h1 className="text-white text-2xl font-medium mb-2">Solution Kitchen</h1>
          <p className="text-zinc-500 text-sm">KDS · Cozinha</p>
        </div>
        <button
          onClick={() => loginWithRedirect()}
          className="w-full max-w-xs py-3.5 rounded-xl bg-violet-600 text-white font-medium text-sm cursor-pointer hover:bg-violet-500 transition-colors"
        >
          Entrar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <KdsHeader
        pending={pending}
        preparing={preparing}
        ready={ready}
        connected={connected}
      />

      {error && (
        <div className="bg-red-950 border-b border-red-900 px-6 py-2 text-red-400 text-sm">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <div className="text-zinc-600 text-5xl">🍳</div>
          <div className="text-zinc-500 text-lg">Nenhum pedido na fila</div>
          <div className="text-zinc-600 text-sm">Os pedidos aparecerão aqui em tempo real</div>
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

      <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-2 flex items-center justify-between">
        <span className="text-zinc-500 text-xs">
          {orders.length} pedido{orders.length !== 1 ? 's' : ''} na tela
        </span>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors cursor-pointer"
        >
          Sair
        </button>
      </div>
    </div>
  )
}

export default App