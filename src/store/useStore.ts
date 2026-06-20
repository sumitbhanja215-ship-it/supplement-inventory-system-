import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  saveProductDoc, updateProductDoc, deleteProductDoc,
  saveStockMovementDoc, saveTransferDoc, updateTransferDoc,
  saveSaleDoc, saveLogDoc, saveNotificationDoc, updateNotificationDoc,
  saveLocationDoc, updateLocationDoc, deleteLocationDoc,
  saveCategoryDoc, deleteCategoryDoc,
  saveBrandDoc, deleteBrandDoc,
  saveSupplierDoc, updateSupplierDoc,
  saveUserDoc, updateUserDoc, deleteUserDoc,
  getUserByPin, saveSettingsDoc, stripUndefined,
  deleteAllLogDocs,
} from '../services/firestoreService';
import type {
  User, Location, Category, Brand, Supplier, Product,
  StockMovement, Transfer, Log, Notification, POSSale,
  AppSettings, LogAction, Theme,
} from '../types';

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;

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

  // Internal setters (used by onSnapshot listeners)
  _setUsers: (users: User[]) => void;
  _setLocations: (locations: Location[]) => void;
  _setCategories: (categories: Category[]) => void;
  _setBrands: (brands: Brand[]) => void;
  _setSuppliers: (suppliers: Supplier[]) => void;
  _setProducts: (products: Product[]) => void;
  _setStockMovements: (movements: StockMovement[]) => void;
  _setTransfers: (transfers: Transfer[]) => void;
  _setLogs: (logs: Log[]) => void;
  _setNotifications: (notifications: Notification[]) => void;
  _setPosSales: (sales: POSSale[]) => void;
  _setSettings: (settings: AppSettings) => void;
  _setAuthLoading: (loading: boolean) => void;

  // Auth Actions
  login: (emailOrPin: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setCurrentUserFromAuth: (user: User | null) => void;

  // User Actions
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Location Actions
  addLocation: (name: string) => Promise<void>;
  renameLocation: (id: string, name: string) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;

  // Category Actions
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Brand Actions
  addBrand: (name: string) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;

  // Supplier Actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;

  // Product Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Stock Actions
  stockIn: (movement: Omit<StockMovement, 'id' | 'timestamp' | 'type'>) => Promise<void>;
  stockOut: (movement: Omit<StockMovement, 'id' | 'timestamp' | 'type'>) => Promise<void>;

  // Transfer Actions
  createTransfer: (transfer: Omit<Transfer, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  completeTransfer: (id: string) => Promise<void>;

  // POS Actions
  createPOSSale: (sale: Omit<POSSale, 'id' | 'timestamp'>) => Promise<void>;

  // Notification Actions
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;

  // Log Actions
  addLog: (action: LogAction, description: string, metadata?: Record<string, unknown>) => void;
  resetLogs: () => Promise<void>;
  logDebounceMap: Map<string, number>;

  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // UI Actions
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: Theme) => void;
}

export const useStore = create<AppState>()((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  authLoading: true,
  users: [],
  locations: [],
  categories: [],
  brands: [],
  suppliers: [],
  products: [],
  stockMovements: [],
  transfers: [],
  logs: [],
  notifications: [],
  posSales: [],
  logDebounceMap: new Map(),
  settings: {
    storeName: "KOUSHIK'S THE SUPPLEMENT STORE",
    currency: '₹',
    theme: 'light',
    inactivityTimeout: 30,
  },
  sidebarOpen: false,
  activeTab: 'dashboard',

  // ─── Internal setters ──────────────────────────────────────────────────────
  _setUsers: (users) => set({ users }),
  _setLocations: (locations) => set({ locations }),
  _setCategories: (categories) => set({ categories }),
  _setBrands: (brands) => set({ brands }),
  _setSuppliers: (suppliers) => set({ suppliers }),
  _setProducts: (products) => set({ products }),
  _setStockMovements: (stockMovements) => set({ stockMovements }),
  _setTransfers: (transfers) => set({ transfers }),
  _setLogs: (logs) => set({ logs }),
  _setNotifications: (notifications) => set({ notifications }),
  _setPosSales: (posSales) => set({ posSales }),
  _setSettings: (settings) => set({ settings }),
  _setAuthLoading: (authLoading) => set({ authLoading }),

  // ─── Auth ──────────────────────────────────────────────────────────────────
  setCurrentUserFromAuth: (user) => {
    set({ currentUser: user, isAuthenticated: !!user, authLoading: false });
  },

  login: async (emailOrPin, password) => {
    try {
      if (password) {
        console.log('[Login] Email login attempt:', emailOrPin);
        await signInWithEmailAndPassword(auth, emailOrPin, password);
        console.log('[Login] Firebase Auth success');
        return true;
      } else {
        console.log('[Login] PIN login attempt');
        const user = await getUserByPin(emailOrPin);
        if (!user) {
          console.log('[Login] PIN not found in Firestore');
          return false;
        }
        console.log('[Login] PIN matched user:', user.email);
        await signInWithEmailAndPassword(auth, user.email, user.password);
        console.log('[Login] PIN Firebase Auth success');
        return true;
      }
    } catch (err) {
      console.error('[Login] Error:', err);
      return false;
    }
  },

  logout: async () => {
    const { currentUser } = get();
    if (currentUser) {
      get().addLog('logout', `${currentUser.name} logged out from system`);
    }
    await signOut(auth);
    set({ currentUser: null, isAuthenticated: false, activeTab: 'dashboard' });
  },

  // ─── Users ────────────────────────────────────────────────────────────────
  addUser: async (userData) => {
    // Save current admin credentials so we can re-authenticate after creating new user
    const admin = get().currentUser;
    const adminEmail = admin?.email || '';
    const adminPassword = admin?.password || '';

    console.log('[addUser] Creating Firebase Auth user:', userData.email);

    let newUid = '';
    try {
      // createUserWithEmailAndPassword automatically signs in as the NEW user
      const cred = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      newUid = cred.user.uid;
      console.log('[addUser] Auth user created, UID:', newUid);
    } catch (err) {
      console.error('[addUser] Firebase Auth creation failed:', err);
      throw err;
    }

    // Build Firestore user document
    const user: User = {
      ...userData,
      id: newUid,
      // Ensure no undefined values — use null for optional fields
      pin: userData.pin || undefined,
      assignedLocation: userData.assignedLocation || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      console.log('[addUser] Writing Firestore document for UID:', newUid);
      await saveUserDoc(user);
      console.log('[addUser] Firestore document created successfully');
    } catch (err) {
      console.error('[addUser] Firestore write failed:', err);
      // Still re-sign-in as admin even if Firestore write failed
    }

    // Re-authenticate as admin (createUserWithEmailAndPassword signed us in as new user)
    if (adminEmail && adminPassword) {
      try {
        console.log('[addUser] Re-authenticating as admin:', adminEmail);
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('[addUser] Admin re-auth success');
      } catch (err) {
        console.error('[addUser] Admin re-auth failed:', err);
        throw err;
      }
    }

    get().addLog('user_created', `User ${user.name} (${user.role}) created`, { userId: newUid });
  },

  updateUser: async (id, data) => {
    console.log('[updateUser] Updating user:', id, data);
    await updateUserDoc(id, data);
    // Update in local state immediately
    set(state => ({
      users: state.users.map(u => u.id === id ? { ...u, ...data } : u),
    }));
    const { currentUser } = get();
    const user = get().users.find(u => u.id === id);
    get().addLog('user_edited', `User profile updated by ${currentUser?.name || 'Admin'}`, { userId: id, userName: user?.name });
  },

  deleteUser: async (id) => {
    const user = get().users.find(u => u.id === id);
    await deleteUserDoc(id);
    if (user) get().addLog('user_deleted', `User ${user.name} deleted`, { userId: id });
  },

  // ─── Locations ────────────────────────────────────────────────────────────
  addLocation: async (name) => {
    const location: Location = { id: uuidv4(), name, createdAt: new Date().toISOString() };
    await saveLocationDoc(location);
    get().addLog('location_created', `Location "${name}" created`);
  },

  renameLocation: async (id, name) => {
    await updateLocationDoc(id, { name });
    get().addLog('location_renamed', `Location renamed to "${name}"`);
  },

  deleteLocation: async (id) => {
    const loc = get().locations.find(l => l.id === id);
    await deleteLocationDoc(id);
    if (loc) get().addLog('location_deleted', `Location "${loc.name}" deleted`);
  },

  // ─── Categories ───────────────────────────────────────────────────────────
  addCategory: async (name) => {
    const category: Category = { id: uuidv4(), name, custom: true };
    await saveCategoryDoc(category);
  },

  deleteCategory: async (id) => {
    await deleteCategoryDoc(id);
  },

  // ─── Brands ───────────────────────────────────────────────────────────────
  addBrand: async (name) => {
    const brand: Brand = { id: uuidv4(), name, custom: true };
    await saveBrandDoc(brand);
  },

  deleteBrand: async (id) => {
    await deleteBrandDoc(id);
  },

  // ─── Suppliers ────────────────────────────────────────────────────────────
  addSupplier: async (supplierData) => {
    const supplier: Supplier = { ...supplierData, id: uuidv4(), createdAt: new Date().toISOString() };
    await saveSupplierDoc(supplier);
  },

  updateSupplier: async (id, data) => {
    await updateSupplierDoc(id, data);
  },

  // ─── Products ─────────────────────────────────────────────────────────────
  addProduct: async (productData) => {
    const { currentUser } = get();
    const product: Product = {
      ...productData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.id || 'system',
    };
    set(state => ({ products: [...state.products, product] }));
    await saveProductDoc(product);
    get().addLog('product_created', `Product "${product.name}" created`, { productId: product.id });
    await get().addNotification({ type: 'new_product', title: 'New Product Added', message: `${product.name} has been added to inventory` });
    if (product.quantity <= product.minimumStockLevel) {
      await get().addNotification({ type: 'low_stock', title: 'Low Stock Alert', message: `${product.name} is below minimum stock level`, productId: product.id });
    }
  },

  updateProduct: async (id, data) => {
    set(state => ({
      products: state.products.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p),
    }));
    await updateProductDoc(id, data);
    get().addLog('product_edited', 'Product updated', { productId: id });
  },

  deleteProduct: async (id) => {
    const product = get().products.find(p => p.id === id);
    set(state => ({ products: state.products.filter(p => p.id !== id) }));
    await deleteProductDoc(id);
    if (product) get().addLog('product_deleted' as LogAction, `Product "${product.name}" deleted`);
  },

  // ─── Stock ────────────────────────────────────────────────────────────────
  stockIn: async (movementData) => {
    const movement: StockMovement = {
      ...movementData,
      id: uuidv4(),
      type: 'stock_in',
      timestamp: new Date().toISOString(),
    };
    let newQty = 0;
    set(state => {
      const updatedProducts = state.products.map(p => {
        if (p.id === movement.productId) {
          newQty = p.quantity + movement.quantity;
          return { ...p, quantity: newQty, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      return { stockMovements: [...state.stockMovements, movement], products: updatedProducts };
    });
    await saveStockMovementDoc(movement);
    await updateProductDoc(movement.productId, { quantity: newQty, updatedAt: new Date().toISOString() });
    const product = get().products.find(p => p.id === movementData.productId);
    get().addLog('stock_added', `Stock in: ${movement.quantity} units of ${product?.name}`, { movementId: movement.id });
  },

  stockOut: async (movementData) => {
    const movement: StockMovement = {
      ...movementData,
      id: uuidv4(),
      type: 'stock_out',
      timestamp: new Date().toISOString(),
    };
    let newQty = 0;
    set(state => {
      const updatedProducts = state.products.map(p => {
        if (p.id === movement.productId) {
          newQty = Math.max(0, p.quantity - movement.quantity);
          return { ...p, quantity: newQty, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      return { stockMovements: [...state.stockMovements, movement], products: updatedProducts };
    });
    await saveStockMovementDoc(movement);
    await updateProductDoc(movement.productId, { quantity: newQty, updatedAt: new Date().toISOString() });
    const product = get().products.find(p => p.id === movementData.productId);
    get().addLog('stock_removed', `Stock out: ${movement.quantity} units of ${product?.name}`, { movementId: movement.id });
    const updatedProduct = get().products.find(p => p.id === movementData.productId);
    if (updatedProduct && updatedProduct.quantity <= updatedProduct.minimumStockLevel) {
      await get().addNotification({
        type: 'low_stock', title: 'Low Stock Alert',
        message: `${updatedProduct.name} is now at ${updatedProduct.quantity} units (min: ${updatedProduct.minimumStockLevel})`,
        productId: updatedProduct.id,
      });
    }
  },

  // ─── Transfers ────────────────────────────────────────────────────────────
  createTransfer: async (transferData) => {
    const transfer: Transfer = {
      ...transferData,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      status: 'in_transit',
    };
    let newQty = 0;
    const movementId = uuidv4();
    set(state => {
      const updatedProducts = state.products.map(p => {
        if (p.id === transfer.productId) {
          newQty = Math.max(0, p.quantity - transfer.quantity);
          return { ...p, quantity: newQty, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      const outMovement: StockMovement = {
        id: movementId, productId: transfer.productId, type: 'transfer_out',
        quantity: transfer.quantity, locationId: transfer.fromLocationId,
        userId: transfer.userId, timestamp: new Date().toISOString(),
      };
      return {
        transfers: [...state.transfers, transfer],
        products: updatedProducts,
        stockMovements: [...state.stockMovements, outMovement],
      };
    });
    await saveTransferDoc(transfer);
    await updateProductDoc(transfer.productId, { quantity: newQty, updatedAt: new Date().toISOString() });
    await saveStockMovementDoc({
      id: movementId, productId: transfer.productId, type: 'transfer_out',
      quantity: transfer.quantity, locationId: transfer.fromLocationId,
      userId: transfer.userId, timestamp: new Date().toISOString(),
    });
    const product = get().products.find(p => p.id === transferData.productId);
    const fromLoc = get().locations.find(l => l.id === transferData.fromLocationId);
    const toLoc = get().locations.find(l => l.id === transferData.toLocationId);
    get().addLog('transfer_created', `Transfer: ${transfer.quantity} units of ${product?.name} from ${fromLoc?.name} to ${toLoc?.name}`);
    await get().addNotification({ type: 'transfer', title: 'Transfer Initiated', message: `${transfer.quantity} units of ${product?.name} is en route to ${toLoc?.name}` });
  },

  completeTransfer: async (id) => {
    const transfer = get().transfers.find(t => t.id === id);
    if (!transfer) return;
    const completedAt = new Date().toISOString();
    const inMovementId = uuidv4();
    let newQty = 0;
    set(state => {
      const updatedProducts = state.products.map(p => {
        if (p.id === transfer.productId) {
          newQty = p.quantity + transfer.quantity;
          return { ...p, quantity: newQty, locationId: transfer.toLocationId, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      const inMovement: StockMovement = {
        id: inMovementId, productId: transfer.productId, type: 'transfer_in',
        quantity: transfer.quantity, locationId: transfer.toLocationId,
        userId: transfer.userId, timestamp: completedAt,
      };
      return {
        transfers: state.transfers.map(t => t.id === id ? { ...t, status: 'completed', completedAt } : t),
        products: updatedProducts,
        stockMovements: [...state.stockMovements, inMovement],
      };
    });
    await updateTransferDoc(id, { status: 'completed', completedAt });
    await updateProductDoc(transfer.productId, { quantity: newQty, locationId: transfer.toLocationId, updatedAt: new Date().toISOString() });
    await saveStockMovementDoc({
      id: inMovementId, productId: transfer.productId, type: 'transfer_in',
      quantity: transfer.quantity, locationId: transfer.toLocationId,
      userId: transfer.userId, timestamp: completedAt,
    });
    const product = get().products.find(p => p.id === transfer.productId);
    get().addLog('transfer_completed', `Transfer completed: ${transfer.quantity} units of ${product?.name}`);
  },

  // ─── POS ──────────────────────────────────────────────────────────────────
  createPOSSale: async (saleData) => {
    const sale: POSSale = { ...saleData, id: uuidv4(), timestamp: new Date().toISOString() };
    set(state => ({ posSales: [...state.posSales, sale] }));
    await saveSaleDoc(sale);
    for (const item of sale.items) {
      await get().stockOut({
        productId: item.productId, quantity: item.quantity,
        locationId: sale.locationId, userId: sale.userId,
        reason: 'POS Sale', customerName: sale.customerName,
      });
    }
    get().addLog('pos_sale', `POS Sale: ₹${sale.totalAmount.toFixed(2)}`, { saleId: sale.id });
  },

  // ─── Notifications ────────────────────────────────────────────────────────
  markNotificationRead: async (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
    await updateNotificationDoc(id, { read: true });
  },

  markAllNotificationsRead: async () => {
    const { notifications } = get();
    set(state => ({ notifications: state.notifications.map(n => ({ ...n, read: true })) }));
    await Promise.all(notifications.filter(n => !n.read).map(n => updateNotificationDoc(n.id, { read: true })));
  },

  addNotification: async (notifData) => {
    const notification: Notification = {
      ...notifData,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    set(state => ({ notifications: [notification, ...state.notifications].slice(0, 50) }));
    await saveNotificationDoc(notification);
  },

  // ─── Logs ─────────────────────────────────────────────────────────────────
  addLog: (action, description, metadata) => {
    const { currentUser, logDebounceMap } = get();
    const debounceKey = `${currentUser?.id || 'system'}-${action}-${description}`;
    const now = Date.now();
    const lastLogTime = logDebounceMap.get(debounceKey);
    if (lastLogTime && now - lastLogTime < 5000) {
      return;
    }
    set(state => {
      const newMap = new Map(state.logDebounceMap);
      newMap.set(debounceKey, now);
      return { logDebounceMap: newMap };
    });
    const cleanMetadata = metadata
      ? (stripUndefined(metadata as Record<string, unknown>) as Record<string, unknown>)
      : undefined;
    const log: Log = {
      id: uuidv4(),
      action,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      userRole: currentUser?.role || 'system',
      description,
      metadata: cleanMetadata,
      timestamp: new Date().toISOString(),
    };
    set(state => ({ logs: [log, ...state.logs].slice(0, 1000) }));
    saveLogDoc(log).catch(err => console.error('[addLog] Firestore error:', err));
  },

  resetLogs: async () => {
    await deleteAllLogDocs();
    const { currentUser } = get();
    const log: Log = {
      id: uuidv4(),
      action: 'logs_reset',
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      userRole: currentUser?.role || 'system',
      description: 'All audit logs reset by Super Admin',
      timestamp: new Date().toISOString(),
    };
    set({ logs: [log] });
    saveLogDoc(log).catch(err => console.error('[addLog] Firestore error:', err));
  },

  // ─── Settings ─────────────────────────────────────────────────────────────
  updateSettings: async (newSettings) => {
    set(state => ({ settings: { ...state.settings, ...newSettings } }));
    const updated = get().settings;
    await saveSettingsDoc(updated);
  },

  // ─── UI ───────────────────────────────────────────────────────────────────
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTheme: (theme) => {
    set(state => ({ settings: { ...state.settings, theme } }));
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('koushik-theme', theme);
    } catch { /* ignore */ }
    saveSettingsDoc({ ...get().settings, theme }).catch(console.error);
  },
}));
