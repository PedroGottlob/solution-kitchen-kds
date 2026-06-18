import { useEffect, useState } from 'react'
import type { KitchenOrder } from '../types/kitchen'
import { kitchenService } from '../services/kitchenService'
import { kitchenSignalRService } from '../services/kitchenSignalRService'

function mapOrder(raw: any): KitchenOrder {
  return {
    OrderId: raw.OrderId ?? raw.orderId,
    TenantId: raw.TenantId ?? raw.tenantId,
    TableId: raw.TableId ?? raw.tableId,
    Source: raw.Source ?? raw.source,
    Status: raw.Status ?? raw.status,
    Items: (raw.Items ?? raw.items ?? []).map((i: any) => ({
      ItemId: i.ItemId ?? i.itemId,
      Name: i.Name ?? i.name,
      Quantity: i.Quantity ?? i.quantity,
      Notes: i.Notes ?? i.notes,
    })),
    CreatedAt: raw.CreatedAt ?? raw.createdAt,
    UpdatedAt: raw.UpdatedAt ?? raw.updatedAt,
  }
}

export function useKitchenOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = kitchenSignalRService.onKitchenOrdersUpdated((data: string) => {
      try {
        const incoming = JSON.parse(data).map(mapOrder) as KitchenOrder[]
        setOrders(prev => {
          const incomingIds = incoming.map(o => o.OrderId)
          const keepReady = prev.filter(
            o => o.Status === 'Ready' && !incomingIds.includes(o.OrderId)
          )
          return [...incoming, ...keepReady]
        })
        setConnected(true)
        setError(null)
      } catch (e) {
        console.error('Erro ao parsear mensagem SignalR:', e)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const updateStatus = async (orderId: string, status: KitchenOrder['Status']) => {
    // Optimistic update — atualiza localmente imediatamente
    setOrders(prev =>
      prev.map(o => o.OrderId === orderId ? { ...o, Status: status } : o)
    )

    try {
      await kitchenService.updateStatus(orderId, { status })
    } catch (e) {
      console.error(e)
      // SignalR vai trazer o estado real em caso de erro
    }

    if (status === 'Ready') {
      setTimeout(() => {
        setOrders(prev => prev.filter(o => o.OrderId !== orderId))
      }, 8000)
    }
  }

  return { orders, connected, error, updateStatus }
}