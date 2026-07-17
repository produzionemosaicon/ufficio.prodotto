import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "QUI_LA_TUA_API_KEY",
  authDomain: "QUI_IL_TUO_PROJECT.firebaseapp.com",
  projectId: "QUI_IL_TUO_PROJECT_ID",
  storageBucket: "QUI_IL_TUO_PROJECT.appspot.com",
  messagingSenderId: "QUI_IL_TUO_SENDER_ID",
  appId: "QUI_IL_TUO_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
