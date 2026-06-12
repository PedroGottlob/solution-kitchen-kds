import { useKitchenOrders } from './hooks/useKitchenOrders'
import { OrderCard } from './components/kds/OrderCard'
import { KdsHeader } from './components/kds/KdsHeader'

function App() {
  const { orders, connected, error, updateStatus } = useKitchenOrders()

  const pending = orders.filter(o => o.Status === 'Pending').length
  const preparing = orders.filter(o => o.Status === 'Preparing').length
  const ready = orders.filter(o => o.Status === 'Ready').length

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

      <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-2 flex items-center gap-8">
        <span className="text-zinc-500 text-xs">
          {orders.length} pedido{orders.length !== 1 ? 's' : ''} na tela
        </span>
        <span className="text-zinc-600 text-xs">
          Atualização automática via SSE
        </span>
      </div>
    </div>
  )
}

export default App