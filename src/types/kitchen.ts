export interface KitchenOrderItem {
  ItemId: string
  Name: string
  Quantity: number
  Notes?: string
}

export interface KitchenOrder {
  OrderId: string
  TenantId: string
  TableId?: string
  Source: string
  Status: 'Pending' | 'Preparing' | 'Ready' | 'Delivered'
  Items: KitchenOrderItem[]
  CreatedAt: string
  UpdatedAt: string
}

export type OrderStatus = KitchenOrder['Status']

export interface UpdateStatusPayload {
  status: OrderStatus
}