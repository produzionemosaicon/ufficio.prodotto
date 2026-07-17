import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "mosaicon-campionario.firebaseapp.com",
  projectId: "mosaicon-campionario",
  storageBucket: "mosaicon-campionario.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
