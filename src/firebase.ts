import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBEix_U1BJuLgk17iK1yXUJ2qsIxh7OqCs",
  authDomain: "suplliment-store.firebaseapp.com",
  databaseURL: "https://suplliment-store-default-rtdb.firebaseio.com",
  projectId: "suplliment-store",
  storageBucket: "suplliment-store.firebasestorage.app",
  messagingSenderId: "1088069618650",
  appId: "1:1088069618650:web:c72f63841c16bfeb0c0ee3"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Enable persistent auth so users stay logged in across browser restarts
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error('[Firebase] Failed to set auth persistence:', err);
});
