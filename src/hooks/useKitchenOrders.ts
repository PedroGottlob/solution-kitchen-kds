import { useEffect, useState } from 'react'
import type { KitchenOrder } from '../types/kitchen'
import { kitchenService } from '../services/kitchenService'

export function useKitchenOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const source = kitchenService.streamOrders(
      (data) => {
        setOrders(prev => {
          // Mantém pedidos com status Ready que ainda não sumiram
          const readyIds = prev
            .filter(o => o.Status === 'Ready')
            .map(o => o.OrderId)

          const incomingIds = data.map(o => o.OrderId)

          // Pedidos Ready que não voltaram no stream (já foram removidos no backend)
          const keepReady = prev.filter(
            o => o.Status === 'Ready' && !incomingIds.includes(o.OrderId)
          )

          return [...data, ...keepReady]
        })
        setConnected(true)
        setError(null)
      },
      () => {
        setConnected(false)
        setError('Conexão perdida com o servidor. Reconectando...')
      }
    )

    return () => {
      source.close()
    }
  }, [])

  const updateStatus = async (orderId: string, status: KitchenOrder['Status']) => {
    await kitchenService.updateStatus(orderId, { status })

    if (status === 'Ready') {
      // Atualiza localmente para mostrar "Aguardando retirada"
      setOrders(prev =>
        prev.map(o => o.OrderId === orderId ? { ...o, Status: 'Ready' } : o)
      )

      // Remove da tela após 8 segundos
      setTimeout(() => {
        setOrders(prev => prev.filter(o => o.OrderId !== orderId))
      }, 8000)
    }
  }

  return { orders, connected, error, updateStatus }
}