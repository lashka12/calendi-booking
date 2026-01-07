import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyA9AcvY6S2AB_sPUh8QxID-S10TANMgfbs",
  authDomain: "bussiness-managment-syst-da008.firebaseapp.com",
  projectId: "bussiness-managment-syst-da008",
  storageBucket: "bussiness-managment-syst-da008.firebasestorage.app",
  messagingSenderId: "333252803339",
  appId: "1:333252803339:web:74b350a22eeb5f584fc00e"
};

let app: FirebaseApp;
let db: Firestore;
let functions: Functions;
let emulatorConnected = false;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  functions = getFunctions(app);

  // Connect to emulators in development
  if (process.env.NODE_ENV === 'development' && !emulatorConnected) {
    const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'false';
    
    if (useEmulators) {
      console.log('🔧 Connecting to Firebase Emulators...');
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectFunctionsEmulator(functions, 'localhost', 5001);
        emulatorConnected = true;
        console.log('✅ Connected to Firebase Emulators');
      } catch (error: any) {
        if (!error.message?.includes('already been initialized')) {
          console.warn('⚠️ Emulator connection issue:', error.message);
        }
      }
    }
  }
} else {
  app = {} as FirebaseApp;
  db = {} as Firestore;
  functions = {} as Functions;
}

export { db, functions };
export default app;

