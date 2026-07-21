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
      SelectedOptions: (i.SelectedOptions ?? i.selectedOptions ?? []).map((o: any) => ({
        name: o.Name ?? o.name,
        additionalCost: o.AdditionalCost ?? o.additionalCost ?? 0,
      })),
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
        setOrders(incoming)
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
    setOrders(prev =>
      prev.map(o => o.OrderId === orderId ? { ...o, Status: status } : o)
    )
    try {
      await kitchenService.updateStatus(orderId, { status })
    } catch (e) {
      console.error(e)
    }
  }

  return { orders, connected, error, updateStatus }
}