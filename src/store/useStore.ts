import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  User, Location, Category, Brand, Supplier, Product,
  StockMovement, Transfer, Log, Notification, POSSale,
  AppSettings, LogAction, Theme
} from '../types';

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;

  // Data
  users: User[];
  locations: Location[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  products: Product[];
  stockMovements: StockMovement[];
  transfers: Transfer[];
  logs: Log[];
  notifications: Notification[];
  posSales: POSSale[];

  // UI
  settings: AppSettings;
  sidebarOpen: boolean;
  activeTab: string;

  // Auth Actions
  login: (emailOrPin: string, password?: string) => boolean;
  logout: () => void;

  // User Actions
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Location Actions
  addLocation: (name: string) => void;
  renameLocation: (id: string, name: string) => void;
  deleteLocation: (id: string) => void;

  // Category Actions
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;

  // Brand Actions
  addBrand: (name: string) => void;
  deleteBrand: (id: string) => void;

  // Supplier Actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;

  // Product Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Stock Actions
  stockIn: (movement: Omit<StockMovement, 'id' | 'timestamp' | 'type'>) => void;
  stockOut: (movement: Omit<StockMovement, 'id' | 'timestamp' | 'type'>) => void;

  // Transfer Actions
  createTransfer: (transfer: Omit<Transfer, 'id' | 'timestamp' | 'status'>) => void;
  completeTransfer: (id: string) => void;

  // POS Actions
  createPOSSale: (sale: Omit<POSSale, 'id' | 'timestamp'>) => void;

  // Notification Actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;

  // Log Actions
  addLog: (action: LogAction, description: string, metadata?: Record<string, unknown>) => void;

  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => void;

  // UI Actions
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: Theme) => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Whey Protein' },
  { id: 'cat2', name: 'Creatine' },
  { id: 'cat3', name: 'Glutamine' },
  { id: 'cat4', name: 'L-Carnitine' },
  { id: 'cat5', name: 'Joint Support' },
  { id: 'cat6', name: 'BCAA' },
  { id: 'cat7', name: 'EAA' },
  { id: 'cat8', name: 'Pre Workout' },
  { id: 'cat9', name: 'Liver Detox' },
  { id: 'cat10', name: 'Fat Burners' },
  { id: 'cat11', name: 'Collagen' },
  { id: 'cat12', name: 'Hormonal & Reproductive Health' },
  { id: 'cat13', name: 'Anti-Aging' },
  { id: 'cat14', name: 'Skin, Hair & Nails' },
  { id: 'cat15', name: 'Immune Support' },
  { id: 'cat16', name: 'Brain & Cognitive (Nootropics)' },
  { id: 'cat17', name: 'Multivitamins' },
];

const DEFAULT_BRANDS: Brand[] = [
  { id: 'br1', name: 'Optimum Nutrition' },
  { id: 'br2', name: 'MuscleBlaze' },
  { id: 'br3', name: 'MuscleTech' },
  { id: 'br4', name: 'BSN' },
  { id: 'br5', name: 'Dymatize' },
  { id: 'br6', name: 'Himalaya', custom: false },
  { id: 'br7', name: 'Kapiva', custom: false },
  { id: 'br8', name: 'Organic India', custom: false },
  { id: 'br9', name: 'Wellbeing Nutrition', custom: false },
  { id: 'br10', name: 'AS-IT-IS Nutrition' },
  { id: 'br11', name: 'GNC' },
  { id: 'br12', name: 'HealthKart' },
];

const DEFAULT_LOCATIONS: Location[] = [
  { id: 'loc1', name: 'Warehouse Belghoria', createdAt: new Date().toISOString() },
  { id: 'loc2', name: 'Salt Lake', createdAt: new Date().toISOString() },
  { id: 'loc3', name: 'Dharmatala', createdAt: new Date().toISOString() },
];

const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 'sup1', name: 'National Nutrition Distributors', contact: '9876543210', email: 'info@nnd.in', createdAt: new Date().toISOString() },
  { id: 'sup2', name: 'Bengal Supplement Hub', contact: '9988776655', email: 'sales@bsh.in', createdAt: new Date().toISOString() },
  { id: 'sup3', name: 'Kolkata Fitness Supplies', contact: '9012345678', email: 'kolkata@fitness.in', createdAt: new Date().toISOString() },
];

const DEFAULT_USERS: User[] = [
  {
    id: 'user1',
    name: 'Koushik',
    email: 'admin@koushikstore.com',
    password: 'admin123',
    pin: '1234',
    role: 'super_admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user2',
    name: 'Rahul Manager',
    email: 'manager@koushikstore.com',
    password: 'manager123',
    pin: '2345',
    role: 'store_manager',
    assignedLocation: 'loc1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user3',
    name: 'Priya Staff',
    email: 'staff@koushikstore.com',
    password: 'staff123',
    pin: '3456',
    role: 'staff',
    assignedLocation: 'loc2',
    createdAt: new Date().toISOString(),
  },
];

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod1', name: 'Whey Gold Standard', brandId: 'br1', categoryId: 'cat1',
    batchNumber: 'WGS-2024-001', expiryDate: '2026-06-30', manufacturingDate: '2024-06-30',
    purchasePrice: 2800, sellingPrice: 3499, gstPercentage: 18, quantity: 45,
    minimumStockLevel: 10, supplierId: 'sup1', supplierContact: '9876543210',
    locationId: 'loc1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'user1'
  },
  {
    id: 'prod2', name: 'Creatine Monohydrate 300g', brandId: 'br2', categoryId: 'cat2',
    batchNumber: 'CM-2024-045', expiryDate: '2025-03-15', manufacturingDate: '2023-03-15',
    purchasePrice: 450, sellingPrice: 699, gstPercentage: 18, quantity: 8,
    minimumStockLevel: 15, supplierId: 'sup2', supplierContact: '9988776655',
    locationId: 'loc2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'user1'
  },
  {
    id: 'prod3', name: 'BCAA 2:1:1 Watermelon', brandId: 'br3', categoryId: 'cat6',
    batchNumber: 'BCAA-2024-112', expiryDate: '2025-02-10', manufacturingDate: '2023-02-10',
    purchasePrice: 1200, sellingPrice: 1799, gstPercentage: 18, quantity: 3,
    minimumStockLevel: 10, supplierId: 'sup1', supplierContact: '9876543210',
    locationId: 'loc1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'user1'
  },
  {
    id: 'prod4', name: 'Pre Workout Explosive', brandId: 'br4', categoryId: 'cat8',
    batchNumber: 'PW-2024-088', expiryDate: '2026-12-31', manufacturingDate: '2024-12-31',
    purchasePrice: 1500, sellingPrice: 2199, gstPercentage: 18, quantity: 22,
    minimumStockLevel: 8, supplierId: 'sup3', supplierContact: '9012345678',
    locationId: 'loc3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'user1'
  },
  {
    id: 'prod5', name: 'Himalaya Ashwagandha', brandId: 'br6', categoryId: 'cat12',
    batchNumber: 'HA-2024-200', expiryDate: '2024-12-15', manufacturingDate: '2022-12-15',
    purchasePrice: 180, sellingPrice: 299, gstPercentage: 5, quantity: 30,
    minimumStockLevel: 20, supplierId: 'sup2', supplierContact: '9988776655',
    locationId: 'loc2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'user1'
  },
  {
    id: 'prod6', name: 'Multivitamin Daily', brandId: 'br11', categoryId: 'cat17',
    batchNumber: 'MV-2024-067', expiryDate: '2026-08-20', manufacturingDate: '2024-08-20',
    purchasePrice: 800, sellingPrice: 1299, gstPercentage: 12, quantity: 55,
    minimumStockLevel: 15, supplierId: 'sup1', supplierContact: '9876543210',
    locationId: 'loc1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'user1'
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      users: DEFAULT_USERS,
      locations: DEFAULT_LOCATIONS,
      categories: DEFAULT_CATEGORIES,
      brands: DEFAULT_BRANDS,
      suppliers: DEFAULT_SUPPLIERS,
      products: SAMPLE_PRODUCTS,
      stockMovements: [],
      transfers: [],
      logs: [],
      notifications: [
        {
          id: 'notif1', type: 'low_stock', title: 'Low Stock Alert',
          message: 'BCAA 2:1:1 Watermelon is running low (3 units)', read: false,
          timestamp: new Date().toISOString(), productId: 'prod3'
        },
        {
          id: 'notif2', type: 'expiring', title: 'Expiring Soon',
          message: 'Himalaya Ashwagandha expires on 15 Dec 2024', read: false,
          timestamp: new Date().toISOString(), productId: 'prod5'
        },
      ],
      posSales: [],
      settings: {
        storeName: "KOUSHIK'S THE SUPPLEMENT STORE",
        currency: '₹',
        theme: 'light',
        inactivityTimeout: 30,
      },
      sidebarOpen: false,
      activeTab: 'dashboard',

      login: (emailOrPin, password) => {
        const { users } = get();
        let user: User | undefined;
        if (password) {
          user = users.find(u => u.email === emailOrPin && u.password === password);
        } else {
          user = users.find(u => u.pin === emailOrPin);
        }
        if (user) {
          const updatedUser = { ...user, lastLogin: new Date().toISOString() };
          set(state => ({
            currentUser: updatedUser,
            isAuthenticated: true,
            users: state.users.map(u => u.id === user!.id ? updatedUser : u),
          }));
          get().addLog('login', `${user.name} logged in`, { userId: user.id });
          return true;
        }
        return false;
      },

      logout: () => {
        const { currentUser } = get();
        if (currentUser) {
          get().addLog('logout', `${currentUser.name} logged out`);
        }
        set({ currentUser: null, isAuthenticated: false, activeTab: 'dashboard' });
      },

      addUser: (userData) => {
        const user: User = { ...userData, id: uuidv4(), createdAt: new Date().toISOString() };
        set(state => ({ users: [...state.users, user] }));
        get().addLog('user_created', `User ${user.name} created`);
      },

      updateUser: (id, data) => {
        set(state => ({ users: state.users.map(u => u.id === id ? { ...u, ...data } : u) }));
        get().addLog('user_edited', `User updated`);
      },

      deleteUser: (id) => {
        const user = get().users.find(u => u.id === id);
        set(state => ({ users: state.users.filter(u => u.id !== id) }));
        if (user) get().addLog('user_edited', `User ${user.name} deleted`);
      },

      addLocation: (name) => {
        const location: Location = { id: uuidv4(), name, createdAt: new Date().toISOString() };
        set(state => ({ locations: [...state.locations, location] }));
        get().addLog('location_created', `Location "${name}" created`);
      },

      renameLocation: (id, name) => {
        set(state => ({ locations: state.locations.map(l => l.id === id ? { ...l, name } : l) }));
        get().addLog('location_renamed', `Location renamed to "${name}"`);
      },

      deleteLocation: (id) => {
        const loc = get().locations.find(l => l.id === id);
        set(state => ({ locations: state.locations.filter(l => l.id !== id) }));
        if (loc) get().addLog('location_deleted', `Location "${loc.name}" deleted`);
      },

      addCategory: (name) => {
        const category: Category = { id: uuidv4(), name, custom: true };
        set(state => ({ categories: [...state.categories, category] }));
      },

      deleteCategory: (id) => {
        set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
      },

      addBrand: (name) => {
        const brand: Brand = { id: uuidv4(), name, custom: true };
        set(state => ({ brands: [...state.brands, brand] }));
      },

      deleteBrand: (id) => {
        set(state => ({ brands: state.brands.filter(b => b.id !== id) }));
      },

      addSupplier: (supplierData) => {
        const supplier: Supplier = { ...supplierData, id: uuidv4(), createdAt: new Date().toISOString() };
        set(state => ({ suppliers: [...state.suppliers, supplier] }));
      },

      updateSupplier: (id, data) => {
        set(state => ({ suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...data } : s) }));
      },

      addProduct: (productData) => {
        const product: Product = {
          ...productData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ products: [...state.products, product] }));
        get().addLog('product_created', `Product "${product.name}" created`, { productId: product.id });
        get().addNotification({ type: 'new_product', title: 'New Product Added', message: `${product.name} has been added to inventory` });
        // Check low stock
        if (product.quantity <= product.minimumStockLevel) {
          get().addNotification({ type: 'low_stock', title: 'Low Stock Alert', message: `${product.name} is below minimum stock level`, productId: product.id });
        }
      },

      updateProduct: (id, data) => {
        set(state => ({
          products: state.products.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)
        }));
        get().addLog('product_edited', `Product updated`, { productId: id });
      },

      deleteProduct: (id) => {
        const product = get().products.find(p => p.id === id);
        set(state => ({ products: state.products.filter(p => p.id !== id) }));
        if (product) get().addLog('product_deleted' as LogAction, `Product "${product.name}" deleted`);
      },

      stockIn: (movementData) => {
        const movement: StockMovement = {
          ...movementData,
          id: uuidv4(),
          type: 'stock_in',
          timestamp: new Date().toISOString(),
        };
        set(state => ({
          stockMovements: [...state.stockMovements, movement],
          products: state.products.map(p =>
            p.id === movement.productId
              ? { ...p, quantity: p.quantity + movement.quantity, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
        const product = get().products.find(p => p.id === movementData.productId);
        get().addLog('stock_added', `Stock in: ${movement.quantity} units of ${product?.name}`, { movementId: movement.id });
      },

      stockOut: (movementData) => {
        const movement: StockMovement = {
          ...movementData,
          id: uuidv4(),
          type: 'stock_out',
          timestamp: new Date().toISOString(),
        };
        set(state => ({
          stockMovements: [...state.stockMovements, movement],
          products: state.products.map(p => {
            if (p.id === movement.productId) {
              const newQty = Math.max(0, p.quantity - movement.quantity);
              return { ...p, quantity: newQty, updatedAt: new Date().toISOString() };
            }
            return p;
          }),
        }));
        const product = get().products.find(p => p.id === movementData.productId);
        get().addLog('stock_removed', `Stock out: ${movement.quantity} units of ${product?.name}`, { movementId: movement.id });
        // Check low stock after removal
        const updatedProduct = get().products.find(p => p.id === movementData.productId);
        if (updatedProduct && updatedProduct.quantity <= updatedProduct.minimumStockLevel) {
          get().addNotification({
            type: 'low_stock', title: 'Low Stock Alert',
            message: `${updatedProduct.name} is now at ${updatedProduct.quantity} units (min: ${updatedProduct.minimumStockLevel})`,
            productId: updatedProduct.id
          });
        }
      },

      createTransfer: (transferData) => {
        const transfer: Transfer = {
          ...transferData,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          status: 'in_transit',
        };
        // Immediately deduct from source
        set(state => ({
          transfers: [...state.transfers, transfer],
          products: state.products.map(p =>
            p.id === transfer.productId
              ? { ...p, quantity: Math.max(0, p.quantity - transfer.quantity), updatedAt: new Date().toISOString() }
              : p
          ),
          stockMovements: [...state.stockMovements, {
            id: uuidv4(), productId: transfer.productId, type: 'transfer_out' as const,
            quantity: transfer.quantity, locationId: transfer.fromLocationId,
            userId: transfer.userId, timestamp: new Date().toISOString(),
          }],
        }));
        const product = get().products.find(p => p.id === transferData.productId);
        const fromLoc = get().locations.find(l => l.id === transferData.fromLocationId);
        const toLoc = get().locations.find(l => l.id === transferData.toLocationId);
        get().addLog('transfer_created', `Transfer: ${transfer.quantity} units of ${product?.name} from ${fromLoc?.name} to ${toLoc?.name}`);
        get().addNotification({ type: 'transfer', title: 'Transfer Initiated', message: `${transfer.quantity} units of ${product?.name} is en route to ${toLoc?.name}` });
      },

      completeTransfer: (id) => {
        const transfer = get().transfers.find(t => t.id === id);
        if (!transfer) return;
        set(state => ({
          transfers: state.transfers.map(t => t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t),
          products: state.products.map(p =>
            p.id === transfer.productId
              ? { ...p, quantity: p.quantity + transfer.quantity, locationId: transfer.toLocationId, updatedAt: new Date().toISOString() }
              : p
          ),
          stockMovements: [...state.stockMovements, {
            id: uuidv4(), productId: transfer.productId, type: 'transfer_in' as const,
            quantity: transfer.quantity, locationId: transfer.toLocationId,
            userId: transfer.userId, timestamp: new Date().toISOString(),
          }],
        }));
        const product = get().products.find(p => p.id === transfer.productId);
        get().addLog('transfer_completed', `Transfer completed: ${transfer.quantity} units of ${product?.name}`);
      },

      createPOSSale: (saleData) => {
        const sale: POSSale = { ...saleData, id: uuidv4(), timestamp: new Date().toISOString() };
        set(state => ({ posSales: [...state.posSales, sale] }));
        // Stock out for each item
        sale.items.forEach(item => {
          get().stockOut({
            productId: item.productId, quantity: item.quantity,
            locationId: sale.locationId, userId: sale.userId,
            reason: 'POS Sale', customerName: sale.customerName,
          });
        });
        get().addLog('pos_sale', `POS Sale: ₹${sale.totalAmount.toFixed(2)}`, { saleId: sale.id });
      },

      markNotificationRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
        }));
      },

      markAllNotificationsRead: () => {
        set(state => ({ notifications: state.notifications.map(n => ({ ...n, read: true })) }));
      },

      addNotification: (notifData) => {
        const notification: Notification = {
          ...notifData,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          read: false,
        };
        set(state => ({ notifications: [notification, ...state.notifications].slice(0, 50) }));
      },

      addLog: (action, description, metadata) => {
        const { currentUser } = get();
        const log: Log = {
          id: uuidv4(),
          action,
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'System',
          description,
          metadata,
          timestamp: new Date().toISOString(),
        };
        set(state => ({ logs: [log, ...state.logs].slice(0, 1000) }));
      },

      updateSettings: (newSettings) => {
        set(state => ({ settings: { ...state.settings, ...newSettings } }));
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setTheme: (theme) => {
        set(state => ({ settings: { ...state.settings, theme } }));
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'koushik-supplement-store',
      partialize: (state) => ({
        users: state.users,
        locations: state.locations,
        categories: state.categories,
        brands: state.brands,
        suppliers: state.suppliers,
        products: state.products,
        stockMovements: state.stockMovements,
        transfers: state.transfers,
        logs: state.logs,
        notifications: state.notifications,
        posSales: state.posSales,
        settings: state.settings,
      }),
    }
  )
);
