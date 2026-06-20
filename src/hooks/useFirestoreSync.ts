import { useEffect, useRef } from 'react';
import { onSnapshot, collection, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useStore } from '../store/useStore';
import {
  docToUser, docToProduct, docToLocation, docToCategory, docToBrand,
  docToSupplier, docToStockMovement, docToTransfer, docToLog,
  docToNotification, docToSale,
} from '../services/firestoreService';
import type { AppSettings } from '../types';

export function useFirestoreSync() {
  const {
    setCurrentUserFromAuth, _setAuthLoading,
    _setUsers, _setProducts, _setLocations, _setCategories,
    _setBrands, _setSuppliers, _setStockMovements, _setTransfers,
    _setLogs, _setNotifications, _setPosSales, _setSettings,
  } = useStore();

  const dataUnsubs = useRef<Array<() => void>>([]);

  const startDataListeners = () => {
    dataUnsubs.current.forEach(u => u());
    dataUnsubs.current = [];

    const push = (u: () => void) => dataUnsubs.current.push(u);

    push(onSnapshot(collection(db, 'users'), (snap) => {
      _setUsers(snap.docs.map(d => docToUser(d.id, d.data() as Record<string, unknown>)));
    }, (err) => console.warn('[Firestore] users listener error:', err.code)));

    push(onSnapshot(collection(db, 'products'), (snap) => {
      _setProducts(snap.docs.map(d => docToProduct(d.id, d.data() as Record<string, unknown>)));
    }, (err) => console.warn('[Firestore] products listener error:', err.code)));

    push(onSnapshot(collection(db, 'locations'), (snap) => {
      _setLocations(snap.docs.map(d => docToLocation(d.id, d.data() as Record<string, unknown>)));
    }, (err) => console.warn('[Firestore] locations listener error:', err.code)));

    push(onSnapshot(collection(db, 'categories'), (snap) => {
      _setCategories(snap.docs.map(d => docToCategory(d.id, d.data() as Record<string, unknown>)));
    }, (err) => console.warn('[Firestore] categories listener error:', err.code)));

    push(onSnapshot(collection(db, 'brands'), (snap) => {
      _setBrands(snap.docs.map(d => docToBrand(d.id, d.data() as Record<string, unknown>)));
    }, (err) => console.warn('[Firestore] brands listener error:', err.code)));

    push(onSnapshot(collection(db, 'suppliers'), (snap) => {
      _setSuppliers(snap.docs.map(d => docToSupplier(d.id, d.data() as Record<string, unknown>)));
    }, (err) => console.warn('[Firestore] suppliers listener error:', err.code)));

    push(onSnapshot(
      query(collection(db, 'stockMovements'), orderBy('timestamp', 'desc'), limit(500)),
      (snap) => {
        _setStockMovements(snap.docs.map(d => docToStockMovement(d.id, d.data() as Record<string, unknown>)));
      }, (err) => console.warn('[Firestore] stockMovements listener error:', err.code)
    ));

    push(onSnapshot(
      query(collection(db, 'transfers'), orderBy('timestamp', 'desc'), limit(200)),
      (snap) => {
        _setTransfers(snap.docs.map(d => docToTransfer(d.id, d.data() as Record<string, unknown>)));
      }, (err) => console.warn('[Firestore] transfers listener error:', err.code)
    ));

    push(onSnapshot(
      query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(1000)),
      (snap) => {
        _setLogs(snap.docs.map(d => docToLog(d.id, d.data() as Record<string, unknown>)));
      }, (err) => console.warn('[Firestore] auditLogs listener error:', err.code)
    ));

    push(onSnapshot(
      query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(50)),
      (snap) => {
        _setNotifications(snap.docs.map(d => docToNotification(d.id, d.data() as Record<string, unknown>)));
      }, (err) => console.warn('[Firestore] notifications listener error:', err.code)
    ));

    push(onSnapshot(
      query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(500)),
      (snap) => {
        _setPosSales(snap.docs.map(d => docToSale(d.id, d.data() as Record<string, unknown>)));
      }, (err) => console.warn('[Firestore] sales listener error:', err.code)
    ));

    push(onSnapshot(collection(db, 'settings'), (snap) => {
      const globalDoc = snap.docs.find(d => d.id === 'global');
      if (globalDoc) {
        const firestoreSettings = globalDoc.data() as AppSettings;
        // Respect localStorage theme preference over Firestore to prevent flicker
        const savedTheme = localStorage.getItem('koushik-theme') as 'light' | 'dark' | null;
        if (savedTheme) {
          firestoreSettings.theme = savedTheme;
        }
        _setSettings(firestoreSettings);
      }
    }, (err) => console.warn('[Firestore] settings listener error:', err.code)));
  };

  const stopDataListeners = () => {
    dataUnsubs.current.forEach(u => u());
    dataUnsubs.current = [];
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[Auth] User signed in UID:', firebaseUser.uid);
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const userProfile = docToUser(snap.id, snap.data() as Record<string, unknown>);
            userProfile.lastLogin = new Date().toISOString();
            console.log('[Auth] Profile loaded:', userProfile.name, '/', userProfile.role);
            setCurrentUserFromAuth(userProfile);
            useStore.getState().addLog('login', `${userProfile.name} logged in`, { userId: userProfile.id });
            // Start real-time listeners only after profile is confirmed
            startDataListeners();
          } else {
            // Firebase Auth succeeded but Firestore profile doesn't exist.
            // Sign the user out so the login page can show a proper error.
            console.warn('[Auth] No Firestore profile for UID:', firebaseUser.uid,
              '— signing out. Use "Sync User" to create the profile.');
            await signOut(auth);
            // setCurrentUserFromAuth(null) will be called by the next onAuthStateChanged(null)
          }
        } catch (err) {
          console.error('[Auth] Failed to load user profile:', err);
          await signOut(auth);
        }
      } else {
        console.log('[Auth] User signed out');
        stopDataListeners();
        setCurrentUserFromAuth(null);
        _setAuthLoading(false);
      }
    });

    return () => {
      unsubAuth();
      stopDataListeners();
    };
  }, []);
}
