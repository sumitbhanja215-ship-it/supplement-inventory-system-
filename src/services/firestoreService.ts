import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  query, serverTimestamp, Timestamp, getDocs, where,
  writeBatch, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  User, Location, Category, Brand, Supplier, Product,
  StockMovement, Transfer, Log, Notification, POSSale, AppSettings, LogAction,
} from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDate(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

/** Recursively removes `undefined` values so Firestore doesn't reject them. */
export function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Timestamp)) {
      result[k] = stripUndefined(v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result;
}

export function docToUser(id: string, data: Record<string, unknown>): User {
  return {
    id,
    name: (data.name as string) || '',
    email: (data.email as string) || '',
    password: (data.password as string) || '',
    pin: (data.pin as string) || undefined,
    role: (data.role as User['role']) || 'staff',
    assignedLocation: (data.assignedLocation as string) || undefined,
    avatar: data.avatar as string | undefined,
    createdAt: toDate(data.createdAt),
    lastLogin: data.lastLogin ? toDate(data.lastLogin) : undefined,
    status: (data.status as 'online' | 'offline') || undefined,
    lastActive: data.lastActive ? toDate(data.lastActive) : undefined,
    lastSeen: data.lastSeen ? toDate(data.lastSeen) : undefined,
    sessionId: (data.sessionId as string) || undefined,
  };
}

export function docToProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: data.name as string,
    brandId: data.brandId as string,
    categoryId: data.categoryId as string,
    batchNumber: data.batchNumber as string,
    expiryDate: data.expiryDate as string,
    manufacturingDate: data.manufacturingDate as string,
    purchasePrice: data.purchasePrice as number,
    sellingPrice: data.sellingPrice as number,
    gstPercentage: data.gstPercentage as number,
    quantity: data.quantity as number,
    minimumStockLevel: data.minimumStockLevel as number,
    supplierId: data.supplierId as string,
    supplierContact: (data.supplierContact as string) || '',
    notes: data.notes as string | undefined,
    locationId: data.locationId as string,
    images: data.images as string[] | undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    createdBy: (data.createdBy as string) || 'system',
  };
}

export function docToLocation(id: string, data: Record<string, unknown>): Location {
  return {
    id,
    name: data.name as string,
    address: data.address as string | undefined,
    createdAt: toDate(data.createdAt),
  };
}

export function docToCategory(id: string, data: Record<string, unknown>): Category {
  return { id, name: data.name as string, custom: data.custom as boolean | undefined };
}

export function docToBrand(id: string, data: Record<string, unknown>): Brand {
  return { id, name: data.name as string, custom: data.custom as boolean | undefined };
}

export function docToSupplier(id: string, data: Record<string, unknown>): Supplier {
  return {
    id,
    name: data.name as string,
    contact: data.contact as string,
    email: data.email as string | undefined,
    address: data.address as string | undefined,
    createdAt: toDate(data.createdAt),
  };
}

export function docToStockMovement(id: string, data: Record<string, unknown>): StockMovement {
  return {
    id,
    productId: data.productId as string,
    type: data.type as StockMovement['type'],
    quantity: data.quantity as number,
    locationId: data.locationId as string,
    purchaseCost: data.purchaseCost as number | undefined,
    supplierId: data.supplierId as string | undefined,
    invoiceNumber: data.invoiceNumber as string | undefined,
    reason: data.reason as string | undefined,
    customerName: data.customerName as string | undefined,
    userId: data.userId as string,
    timestamp: toDate(data.timestamp),
    notes: data.notes as string | undefined,
  };
}

export function docToTransfer(id: string, data: Record<string, unknown>): Transfer {
  return {
    id,
    productId: data.productId as string,
    fromLocationId: data.fromLocationId as string,
    toLocationId: data.toLocationId as string,
    quantity: data.quantity as number,
    userId: data.userId as string,
    timestamp: toDate(data.timestamp),
    completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
    status: data.status as Transfer['status'],
    notes: data.notes as string | undefined,
  };
}

export function docToLog(id: string, data: Record<string, unknown>): Log {
  return {
    id,
    action: data.action as LogAction,
    userId: data.userId as string,
    userName: data.userName as string,
    userRole: (data.userRole as string) || '',
    description: data.description as string,
    metadata: data.metadata as Record<string, unknown> | undefined,
    timestamp: toDate(data.timestamp),
  };
}

export function docToNotification(id: string, data: Record<string, unknown>): Notification {
  return {
    id,
    type: data.type as Notification['type'],
    title: data.title as string,
    message: data.message as string,
    read: (data.read as boolean) || false,
    timestamp: toDate(data.timestamp),
    productId: data.productId as string | undefined,
  };
}

export function docToSale(id: string, data: Record<string, unknown>): POSSale {
  return {
    id,
    items: (data.items as POSSale['items']) || [],
    totalAmount: data.totalAmount as number,
    paymentMethod: 'cash',
    locationId: data.locationId as string,
    userId: data.userId as string,
    timestamp: toDate(data.timestamp),
    customerName: data.customerName as string | undefined,
  };
}

// ─── Users ───────────────────────────────────────────────────────────────────

/** Build a clean Firestore payload for a user — no undefined fields. */
function userPayload(user: Omit<User, 'id'>): Record<string, unknown> {
  return stripUndefined({
    name: user.name,
    email: user.email,
    password: user.password,
    pin: user.pin || null,
    role: user.role,
    assignedLocation: user.assignedLocation || null,
    avatar: user.avatar || null,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin || null,
    status: user.status || null,
    lastActive: user.lastActive || null,
    lastSeen: user.lastSeen || null,
    sessionId: user.sessionId || null,
  });
}

export async function saveUserDoc(user: User): Promise<void> {
  const { id, ...rest } = user;
  console.log('[Firestore] saveUserDoc uid:', id);
  await setDoc(doc(db, 'users', id), userPayload(rest));
  console.log('[Firestore] saveUserDoc success:', id);
}

export async function updateUserDoc(id: string, data: Partial<User>): Promise<void> {
  const payload = stripUndefined(
    Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v])
    )
  );
  await updateDoc(doc(db, 'users', id), { ...payload, updatedAt: serverTimestamp() });
}

export async function deleteUserDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', id));
}

export async function getUserByPin(pin: string): Promise<User | null> {
  const q = query(collection(db, 'users'), where('pin', '==', pin));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return docToUser(d.id, d.data() as Record<string, unknown>);
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function saveProductDoc(product: Product): Promise<void> {
  const { id, ...data } = product;
  await setDoc(doc(db, 'products', id), stripUndefined({ ...data, updatedAt: serverTimestamp() }));
}

export async function updateProductDoc(id: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, 'products', id), stripUndefined({ ...data, updatedAt: serverTimestamp() }));
}

export async function deleteProductDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

// ─── Locations ───────────────────────────────────────────────────────────────

export async function saveLocationDoc(location: Location): Promise<void> {
  const { id, ...data } = location;
  await setDoc(doc(db, 'locations', id), stripUndefined(data));
}

export async function updateLocationDoc(id: string, data: Partial<Location>): Promise<void> {
  await updateDoc(doc(db, 'locations', id), stripUndefined(data));
}

export async function deleteLocationDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'locations', id));
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function saveCategoryDoc(category: Category): Promise<void> {
  const { id, ...data } = category;
  await setDoc(doc(db, 'categories', id), stripUndefined(data));
}

export async function deleteCategoryDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', id));
}

// ─── Brands ──────────────────────────────────────────────────────────────────

export async function saveBrandDoc(brand: Brand): Promise<void> {
  const { id, ...data } = brand;
  await setDoc(doc(db, 'brands', id), stripUndefined(data));
}

export async function deleteBrandDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'brands', id));
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export async function saveSupplierDoc(supplier: Supplier): Promise<void> {
  const { id, ...data } = supplier;
  await setDoc(doc(db, 'suppliers', id), stripUndefined(data));
}

export async function updateSupplierDoc(id: string, data: Partial<Supplier>): Promise<void> {
  await updateDoc(doc(db, 'suppliers', id), stripUndefined(data));
}

// ─── Stock Movements ─────────────────────────────────────────────────────────

export async function saveStockMovementDoc(movement: StockMovement): Promise<void> {
  const { id, ...data } = movement;
  await setDoc(doc(db, 'stockMovements', id), stripUndefined({ ...data, timestamp: serverTimestamp() }));
}

// ─── Transfers ───────────────────────────────────────────────────────────────

export async function saveTransferDoc(transfer: Transfer): Promise<void> {
  const { id, ...data } = transfer;
  await setDoc(doc(db, 'transfers', id), stripUndefined({ ...data, timestamp: serverTimestamp() }));
}

export async function updateTransferDoc(id: string, data: Partial<Transfer>): Promise<void> {
  await updateDoc(doc(db, 'transfers', id), stripUndefined(data));
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export async function saveLogDoc(log: Log): Promise<void> {
  const { id, ...data } = log;
  await setDoc(doc(db, 'auditLogs', id), stripUndefined({ ...data, timestamp: serverTimestamp() }));
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function saveNotificationDoc(notif: Notification): Promise<void> {
  const { id, ...data } = notif;
  await setDoc(doc(db, 'notifications', id), stripUndefined({ ...data, timestamp: serverTimestamp() }));
}

export async function updateNotificationDoc(id: string, data: Partial<Notification>): Promise<void> {
  await updateDoc(doc(db, 'notifications', id), stripUndefined(data));
}

// ─── POS Sales ───────────────────────────────────────────────────────────────

export async function saveSaleDoc(sale: POSSale): Promise<void> {
  const { id, ...data } = sale;
  await setDoc(doc(db, 'sales', id), stripUndefined({ ...data, timestamp: serverTimestamp() }));
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function saveSettingsDoc(settings: AppSettings): Promise<void> {
  await setDoc(doc(db, 'settings', 'global'), stripUndefined(settings as unknown as Record<string, unknown>));
}

export async function getSettingsDoc(): Promise<AppSettings | null> {
  const snap = await getDoc(doc(db, 'settings', 'global'));
  if (!snap.exists()) return null;
  return snap.data() as AppSettings;
}

// ─── Seeding Check ───────────────────────────────────────────────────────────

export async function isFirestoreSeeded(): Promise<boolean> {
  const snap = await getDocs(collection(db, 'users'));
  return !snap.empty;
}

// ─── Batch seed ──────────────────────────────────────────────────────────────

export async function batchSeed(
  items: Array<{ col: string; id: string; data: Record<string, unknown> }>,
  merge = true,
): Promise<void> {
  const CHUNK = 400;
  for (let i = 0; i < items.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const item of items.slice(i, i + CHUNK)) {
      batch.set(doc(db, item.col, item.id), stripUndefined(item.data), { merge });
    }
    await batch.commit();
  }
}

export async function deleteAllLogDocs(): Promise<void> {
  const snap = await getDocs(collection(db, 'auditLogs'));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(doc(db, 'auditLogs', d.id)));
  await batch.commit();
}
