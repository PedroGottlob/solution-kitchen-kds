import * as signalR from '@microsoft/signalr'

const BASE_URL = import.meta.env.VITE_BFF_COZINHA_URL || 'http://localhost:5164'

class KitchenSignalRService {
  private connection: signalR.HubConnection | null = null
  private listeners: Map<string, Set<(data: string) => void>> = new Map()
  private tenantId: string = '00000000-0000-0000-0000-000000000001'
  private connecting: boolean = false
  private getAccessToken: (() => Promise<string>) | null = null

  setTenantId(tenantId: string) {
    this.tenantId = tenantId
  }

  setAuthTokenGetter(getter: () => Promise<string>) {
    this.getAccessToken = getter
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'X-Tenant-Id': this.tenantId }
    if (this.getAccessToken) {
      try {
        const token = await this.getAccessToken()
        headers['Authorization'] = `Bearer ${token}`
      } catch {
        // Sem token disponível — segue sem Authorization, o backend rejeita
        // com 401 se a rota exigir login.
      }
    }
    return headers
  }

  async connect() {
    if (this.connecting) return
    if (this.connection?.state === signalR.HubConnectionState.Connected) return
    if (this.connection?.state === signalR.HubConnectionState.Connecting) return
    if (this.connection?.state === signalR.HubConnectionState.Reconnecting) return

    this.connecting = true

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${BASE_URL}/hubs/kitchen`, {
          headers: await this.authHeaders()
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
    } finally {
      this.connecting = false
    }
  }

  private async fetchAndNotify() {
    try {
      const response = await fetch(`${BASE_URL}/api/kitchen/orders`, {
        headers: await this.authHeaders()
      })
      if (!response.ok) {
        throw new Error(`Falha ao buscar pedidos: HTTP ${response.status}`)
      }
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