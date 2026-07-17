import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCv_jcxTUu3gU7RKJiq5R_CWwET6-UEfCY",
  authDomain: "ufficio-prodotto.firebaseapp.com",
  projectId: "ufficio-prodotto",
  storageBucket: "ufficio-prodotto.firebasestorage.app",
  messagingSenderId: "1028948785079",
  appId: "1:1028948785079:web:3e74bd62bdbaa58aec5a32"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
