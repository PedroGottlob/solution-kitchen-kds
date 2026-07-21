export interface SelectedOption {
  name: string
  additionalCost: number
}

export interface KitchenOrderItem {
  ItemId: string
  Name: string
  Quantity: number
  Notes?: string
  SelectedOptions?: SelectedOption[]
}

export interface KitchenOrder {
  OrderId: string
  TenantId: string
  TableId?: string
  TableNumber?: number
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