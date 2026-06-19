import * as signalR from '@microsoft/signalr'

const BASE_URL = import.meta.env.VITE_BFF_COZINHA_URL || 'http://localhost:5164'

class KitchenSignalRService {
  private connection: signalR.HubConnection | null = null
  private listeners: Map<string, Set<(data: string) => void>> = new Map()
  private tenantId: string = '00000000-0000-0000-0000-000000000001'

  setTenantId(tenantId: string) {
    this.tenantId = tenantId
  }

  async connect() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/kitchen`, {
        headers: { 'X-Tenant-Id': this.tenantId }
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    this.connection.on('KitchenOrdersUpdated', (data: string) => {
      this.listeners.get('KitchenOrdersUpdated')?.forEach(cb => cb(data))
    })

    this.connection.onreconnected(async () => {
      await this.connection!.invoke('JoinTenant', this.tenantId)
      await this.fetchAndNotify()
    })

    await this.connection.start()
    await this.connection.invoke('JoinTenant', this.tenantId)
    await this.fetchAndNotify()
  }

  private async fetchAndNotify() {
    try {
      const response = await fetch(`${BASE_URL}/api/kitchen/orders`, {
        headers: { 'X-Tenant-Id': this.tenantId }
      })
      const orders = await response.json()
      const data = JSON.stringify(orders)
      this.listeners.get('KitchenOrdersUpdated')?.forEach(cb => cb(data))
    } catch (e) {
      console.error('Erro ao buscar pedidos iniciais da cozinha:', e)
    }
  }

  onKitchenOrdersUpdated(callback: (data: string) => void) {
    if (!this.listeners.has('KitchenOrdersUpdated')) {
      this.listeners.set('KitchenOrdersUpdated', new Set())
    }
    this.listeners.get('KitchenOrdersUpdated')!.add(callback)
    return () => this.listeners.get('KitchenOrdersUpdated')?.delete(callback)
  }

  get state() {
    return this.connection?.state
  }
}

export const kitchenSignalRService = new KitchenSignalRService()