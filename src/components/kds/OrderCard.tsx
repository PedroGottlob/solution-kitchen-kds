import type { KitchenOrder } from '../../types/kitchen'

interface OrderCardProps {
  order: KitchenOrder
  onUpdateStatus: (orderId: string, status: KitchenOrder['Status']) => void
}

function getElapsedMinutes(createdAt: string): number {
  const date = new Date(createdAt)
  if (isNaN(date.getTime())) return 0
  return Math.floor((Date.now() - date.getTime()) / 60000)
}

function getTimerColor(createdAt: string): string {
  const minutes = getElapsedMinutes(createdAt)
  if (minutes >= 15) return 'text-red-400 bg-red-950'
  if (minutes >= 8) return 'text-amber-400 bg-amber-950'
  return 'text-emerald-400 bg-emerald-950'
}

function getBorderColor(order: KitchenOrder): string {
  if (order.Status === 'Ready') return 'border-emerald-900'
  const minutes = getElapsedMinutes(order.CreatedAt)
  if (minutes >= 15) return 'border-red-900'
  return 'border-zinc-800'
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    mobile: 'mobile',
    totem: 'totem',
    waiter: 'garçom',
  }
  return labels[source] ?? source
}

export function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const elapsed = getElapsedMinutes(order.CreatedAt)
  const timerColor = getTimerColor(order.CreatedAt)
  const borderColor = getBorderColor(order)
  const items = order.Items ?? []

  return (
    <div className={`bg-zinc-900 rounded-xl border ${borderColor} overflow-hidden`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <span className="text-white font-medium text-base">
            Mesa {order.TableNumber ?? order.TableId?.slice(-4).toUpperCase() ?? '—'}
          </span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            {getSourceLabel(order.Source)}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${timerColor}`}>
          {elapsed} min
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${order.Status === 'Ready' ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                <span className="text-accent-400">{item.Quantity}× </span>
                {item.Name}
              </span>
            </div>
            {item.Notes && (
              <p className="text-xs text-zinc-500 ml-6 mt-0.5">{item.Notes}</p>
            )}
            {item.SelectedOptions && item.SelectedOptions.length > 0 && (
              <div className="ml-6 mt-1 flex flex-wrap gap-1">
                {item.SelectedOptions.map((opt, j) => (
                  <span
                    key={j}
                    className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700"
                  >
                    {opt.name}
                    {opt.additionalCost > 0 && (
                      <span className="text-accent-400 ml-1">+R${opt.additionalCost.toFixed(0)}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
        <div className="flex gap-1">
          {items.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${order.Status !== 'Pending' ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            />
          ))}
        </div>
        {order.Status === 'Pending' && (
          <button
            onClick={() => onUpdateStatus(order.OrderId, 'Preparing')}
            className="text-xs px-3 py-1.5 rounded-lg bg-accent-950 text-accent-400 border border-accent-900 hover:bg-accent-900 transition-colors cursor-pointer"
          >
            Iniciar preparo
          </button>
        )}
        {order.Status === 'Preparing' && (
          <button
            onClick={() => onUpdateStatus(order.OrderId, 'Ready')}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 transition-colors cursor-pointer"
          >
            Marcar pronto
          </button>
        )}
        {order.Status === 'Ready' && (
          <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-900">
            Pronto para servir
          </span>
        )}
      </div>
    </div>
  )
}