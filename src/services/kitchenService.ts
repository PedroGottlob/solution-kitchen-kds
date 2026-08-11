import axios from 'axios'
import type { KitchenOrder, UpdateStatusPayload } from '../types/kitchen'

const BASE_URL = import.meta.env.VITE_BFF_COZINHA_URL || 'http://localhost:5164'
// Fallback só pra dev local sem login; em produção o tenant real vem do
// Auth0 e é aplicado via setTenantId() assim que o usuário loga (ver App.tsx).
const DEV_FALLBACK_TENANT_ID = '00000000-0000-0000-0000-000000000001'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-Tenant-Id': import.meta.env.DEV ? DEV_FALLBACK_TENANT_ID : '',
  },
})

export function setTenantId(tenantId: string) {
  api.defaults.headers['X-Tenant-Id'] = tenantId
}

export const kitchenService = {
  async getOrders(): Promise<KitchenOrder[]> {
    const { data } = await api.get<KitchenOrder[]>('/api/kitchen/orders')
    return data
  },

  async updateStatus(orderId: string, payload: UpdateStatusPayload): Promise<void> {
    await api.patch(`/api/kitchen/orders/${orderId}/status`, payload)
  },

  streamOrders(onData: (orders: KitchenOrder[]) => void, onError?: (err: Event) => void): EventSource {
    const url = `${BASE_URL}/api/kitchen/orders/stream?tenantId=${api.defaults.headers['X-Tenant-Id']}`
    const source = new EventSource(url)

    source.onmessage = (event) => {
      try {
        const orders = JSON.parse(event.data) as KitchenOrder[]
        onData(orders)
      } catch (e) {
        console.error('Erro ao parsear evento SSE:', e)
      }
    }

    if (onError) {
      source.onerror = onError
    }

    return source
  },
}