import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDoc
} from 'firebase/firestore'
import { db } from './firebase'

const COLL = 'ordini'

// Genera numero ordine progressivo: ORD-YYYY-NNNN
export async function nextNumeroOrdine() {
  const year = new Date().getFullYear()
  const counterRef = doc(db, 'meta', 'ordineCounter')
  const snap = await getDoc(counterRef)

  let nextN = 1
  if (snap.exists()) {
    const data = snap.data()
    nextN = (data.lastN || 0) + 1
  }

  if (snap.exists()) {
    await updateDoc(counterRef, { lastN: nextN })
  } else {
    await setDoc(counterRef, { lastN: nextN })
  }

  return `ORD-${year}-${String(nextN).padStart(4, '0')}`
}

// Subscribe all orders, real-time
export function subscribeOrdini(callback) {
  const q = query(collection(db, COLL), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(data)
  })
}

// Create
export async function creaOrdine(dati) {
  const numero = await nextNumeroOrdine()
  return addDoc(collection(db, COLL), {
    ...dati,
    numeroOrdine: numero,
    stato: 'da_inviare',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

// Update fields
export async function aggiornaOrdine(id, dati) {
  return updateDoc(doc(db, COLL, id), {
    ...dati,
    updatedAt: serverTimestamp(),
  })
}

// Advance status
export async function avanzaStato(id, statoCorrente) {
  const flow = ['da_inviare', 'inviato', 'ricevuto']
  const idx = flow.indexOf(statoCorrente)
  if (idx < flow.length - 1) {
    return aggiornaOrdine(id, { stato: flow[idx + 1] })
  }
}

// Delete
export async function eliminaOrdine(id) {
  return deleteDoc(doc(db, COLL, id))
}
