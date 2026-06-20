import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';
import { batchSeed, saveSettingsDoc, isFirestoreSeeded } from './firestoreService';

let seedingInProgress = false;

const DEFAULT_CATEGORIES = [
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

const DEFAULT_BRANDS = [
  { id: 'br1', name: 'Optimum Nutrition' },
  { id: 'br2', name: 'MuscleBlaze' },
  { id: 'br3', name: 'MuscleTech' },
  { id: 'br4', name: 'BSN' },
  { id: 'br5', name: 'Dymatize' },
  { id: 'br6', name: 'Himalaya' },
  { id: 'br7', name: 'Kapiva' },
  { id: 'br8', name: 'Organic India' },
  { id: 'br9', name: 'Wellbeing Nutrition' },
  { id: 'br10', name: 'AS-IT-IS Nutrition' },
  { id: 'br11', name: 'GNC' },
  { id: 'br12', name: 'HealthKart' },
];

const DEFAULT_LOCATIONS = [
  { id: 'loc1', name: 'Warehouse Belghoria', createdAt: new Date().toISOString() },
  { id: 'loc2', name: 'Salt Lake Store', createdAt: new Date().toISOString() },
  { id: 'loc3', name: 'Dharmatala Store', createdAt: new Date().toISOString() },
];

const DEFAULT_SUPPLIERS = [
  { id: 'sup1', name: 'National Nutrition Distributors', contact: '9876543210', email: 'info@nnd.in', createdAt: new Date().toISOString() },
  { id: 'sup2', name: 'Bengal Supplement Hub', contact: '9988776655', email: 'sales@bsh.in', createdAt: new Date().toISOString() },
  { id: 'sup3', name: 'Kolkata Fitness Supplies', contact: '9012345678', email: 'kolkata@fitness.in', createdAt: new Date().toISOString() },
];

const DEFAULT_AUTH_USERS = [
  { email: 'bhanja.sumit94.sb@gmail.com', password: 'Sumit123', pin: '123', name: 'SUMIT', role: 'super_admin', assignedLocation: null },
];

/**
 * Ensures all default Firebase Auth users exist and returns a map of email→UID.
 * Signs out after each user so we end up signed out.
 */
async function ensureAuthUsers(): Promise<Record<string, string>> {
  const uidMap: Record<string, string> = {};
  for (const u of DEFAULT_AUTH_USERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      uidMap[u.email] = cred.user.uid;
      console.log(`[Seed] Created auth user: ${u.email}`);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(auth, u.email, u.password);
          uidMap[u.email] = cred.user.uid;
          console.log(`[Seed] Auth user exists: ${u.email} → ${cred.user.uid}`);
        } catch {
          console.warn(`[Seed] Could not sign in to get UID for ${u.email}`);
        }
      } else {
        console.error('[Seed] Unexpected auth error:', err);
      }
    }
  }
  return uidMap;
}

function getCurrentUserEmail(): Promise<string | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user?.email || null);
    });
  });
}

export async function seedFirestoreIfEmpty(): Promise<void> {
  if (seedingInProgress) {
    console.log('[Seed] Already in progress — skipping.');
    return;
  }
  seedingInProgress = true;

  // Step 0: Capture whether someone is currently logged in
  const preSeedEmail = await getCurrentUserEmail();
  console.log('[Seed] Pre-seed user:', preSeedEmail || 'none');

  // Step 1: Ensure all Firebase Auth users exist and collect their UIDs
  const uidMap = await ensureAuthUsers();

  const adminEmail = 'bhanja.sumit94.sb@gmail.com';
  const adminPassword = 'Sumit123';
  const adminUid = uidMap[adminEmail];

  if (!adminUid) {
    console.error('[Seed] Could not get admin UID. Cannot seed.');
    return;
  }

  // Step 2: Sign in as admin to read and write Firestore
  try {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('[Seed] Signed in as admin for Firestore operations');
  } catch (err) {
    console.error('[Seed] Cannot sign in as admin:', err);
    return;
  }

  // Step 4: Check if the rest of the data (products, categories, etc.) is already seeded
  const seeded = await isFirestoreSeeded();
  if (seeded) {
    console.log('[Seed] Data already seeded.');
    if (preSeedEmail && preSeedEmail !== adminEmail) {
      try { await signOut(auth); } catch { /* ignore */ }
      try { await signInWithEmailAndPassword(auth, preSeedEmail, adminPassword); } catch { /* ignore */ }
    }
    // If preSeedEmail was null, don't sign out — the user may have logged in during seeding
    return;
  }

  console.log('[Seed] Seeding Firestore with default data...');

  const DEFAULT_PRODUCTS = [
    {
      id: 'prod1', name: 'Whey Gold Standard', brandId: 'br1', categoryId: 'cat1',
      batchNumber: 'WGS-2024-001', expiryDate: '2026-06-30', manufacturingDate: '2024-06-30',
      purchasePrice: 2800, sellingPrice: 3499, gstPercentage: 18, quantity: 45,
      minimumStockLevel: 10, supplierId: 'sup1', supplierContact: '9876543210',
      locationId: 'loc1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: adminUid,
    },
    {
      id: 'prod2', name: 'Creatine Monohydrate 300g', brandId: 'br2', categoryId: 'cat2',
      batchNumber: 'CM-2024-045', expiryDate: '2025-03-15', manufacturingDate: '2023-03-15',
      purchasePrice: 450, sellingPrice: 699, gstPercentage: 18, quantity: 8,
      minimumStockLevel: 15, supplierId: 'sup2', supplierContact: '9988776655',
      locationId: 'loc2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: adminUid,
    },
    {
      id: 'prod3', name: 'BCAA 2:1:1 Watermelon', brandId: 'br3', categoryId: 'cat6',
      batchNumber: 'BCAA-2024-112', expiryDate: '2025-02-10', manufacturingDate: '2023-02-10',
      purchasePrice: 1200, sellingPrice: 1799, gstPercentage: 18, quantity: 3,
      minimumStockLevel: 10, supplierId: 'sup1', supplierContact: '9876543210',
      locationId: 'loc1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: adminUid,
    },
    {
      id: 'prod4', name: 'Pre Workout Explosive', brandId: 'br4', categoryId: 'cat8',
      batchNumber: 'PW-2024-088', expiryDate: '2026-12-31', manufacturingDate: '2024-12-31',
      purchasePrice: 1500, sellingPrice: 2199, gstPercentage: 18, quantity: 22,
      minimumStockLevel: 8, supplierId: 'sup3', supplierContact: '9012345678',
      locationId: 'loc3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: adminUid,
    },
    {
      id: 'prod5', name: 'Himalaya Ashwagandha', brandId: 'br6', categoryId: 'cat12',
      batchNumber: 'HA-2024-200', expiryDate: '2024-12-15', manufacturingDate: '2022-12-15',
      purchasePrice: 180, sellingPrice: 299, gstPercentage: 5, quantity: 30,
      minimumStockLevel: 20, supplierId: 'sup2', supplierContact: '9988776655',
      locationId: 'loc2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: adminUid,
    },
    {
      id: 'prod6', name: 'Multivitamin Daily', brandId: 'br11', categoryId: 'cat17',
      batchNumber: 'MV-2024-067', expiryDate: '2026-08-20', manufacturingDate: '2024-08-20',
      purchasePrice: 800, sellingPrice: 1299, gstPercentage: 12, quantity: 55,
      minimumStockLevel: 15, supplierId: 'sup1', supplierContact: '9876543210',
      locationId: 'loc1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: adminUid,
    },
  ];

  const items = [
    ...DEFAULT_CATEGORIES.map(c => ({ col: 'categories', id: c.id, data: { name: c.name, custom: false } })),
    ...DEFAULT_BRANDS.map(b => ({ col: 'brands', id: b.id, data: { name: b.name, custom: false } })),
    ...DEFAULT_LOCATIONS.map(l => ({ col: 'locations', id: l.id, data: { name: l.name, createdAt: l.createdAt } })),
    ...DEFAULT_SUPPLIERS.map(s => ({ col: 'suppliers', id: s.id, data: { ...s } })),
    ...DEFAULT_PRODUCTS.map(p => ({ col: 'products', id: p.id, data: { ...p } })),
  ];

  await batchSeed(items);

  await saveSettingsDoc({
    storeName: "KOUSHIK'S THE SUPPLEMENT STORE",
    currency: '₹',
    theme: 'light',
    inactivityTimeout: 30,
  });

  console.log('[Seed] Done.');
  // Only sign out / re-sign-in if we were the ones who signed in as admin
  // If the user logged in during seeding, don't interfere with their session
  const currentEmail = await getCurrentUserEmail();
  if (currentEmail === adminEmail && preSeedEmail !== adminEmail) {
    // We signed in as admin but were not admin before — sign out and restore
    if (preSeedEmail) {
      try { await signOut(auth); } catch { /* ignore */ }
      try { await signInWithEmailAndPassword(auth, preSeedEmail, adminPassword); } catch { /* ignore */ }
    } else {
      // We signed in as admin but no one was logged in before — just sign out
      try { await signOut(auth); } catch { /* ignore */ }
    }
  }
}
