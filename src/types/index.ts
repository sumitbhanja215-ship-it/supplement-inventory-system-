export type UserRole = 'super_admin' | 'admin' | 'store_manager' | 'staff';
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  pin?: string;
  role: UserRole;
  assignedLocation?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  status?: 'online' | 'offline';
  lastActive?: string;
  lastSeen?: string;
  sessionId?: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  custom?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  custom?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  batchNumber: string;
  expiryDate: string;
  manufacturingDate: string;
  purchasePrice: number;
  sellingPrice: number;
  gstPercentage: number;
  quantity: number;
  minimumStockLevel: number;
  supplierId: string;
  supplierContact: string;
  notes?: string;
  locationId: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type StockMovementType = 'stock_in' | 'stock_out' | 'transfer_out' | 'transfer_in';

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  locationId: string;
  purchaseCost?: number;
  supplierId?: string;
  invoiceNumber?: string;
  reason?: string;
  customerName?: string;
  userId: string;
  timestamp: string;
  notes?: string;
}

export type TransferStatus = 'pending' | 'in_transit' | 'completed';

export interface Transfer {
  id: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  userId: string;
  timestamp: string;
  completedAt?: string;
  status: TransferStatus;
  notes?: string;
}

export type LogAction =
  | 'product_created'
  | 'product_edited'
  | 'product_deleted'
  | 'stock_added'
  | 'stock_removed'
  | 'transfer_created'
  | 'transfer_completed'
  | 'login'
  | 'logout'
  | 'user_created'
  | 'user_edited'
  | 'user_deleted'
  | 'location_created'
  | 'location_renamed'
  | 'location_deleted'
  | 'pos_sale'
  | 'logs_reset'
  | 'user_status_online'
  | 'user_status_offline';

export interface Log {
  id: string;
  action: LogAction;
  userId: string;
  userName: string;
  userRole: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'expiring' | 'transfer' | 'new_product' | 'info';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  productId?: string;
}

export interface POSSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  gstPercentage: number;
}

export interface POSSale {
  id: string;
  items: POSSaleItem[];
  totalAmount: number;
  paymentMethod: 'cash';
  locationId: string;
  userId: string;
  timestamp: string;
  customerName?: string;
}

export interface AppSettings {
  storeName: string;
  currency: string;
  theme: Theme;
  logoUrl?: string;
  inactivityTimeout: number;
}
