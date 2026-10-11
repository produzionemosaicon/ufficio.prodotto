import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDoc
} from 'firebase/firestore'
import { db } from './firebase'

const COLL = 'ordini'

export async function nextNumeroOrdine() {
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

  return `00/${String(nextN).padStart(3, '0')}`
}

export function subscribeOrdini(callback) {
  const q = query(collection(db, COLL), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(data)
  })
}

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

export async function aggiornaOrdine(id, dati) {
  return updateDoc(doc(db, COLL, id), {
    ...dati,
    updatedAt: serverTimestamp(),
  })
}

export async function avanzaStato(id, statoCorrente, extra = {}) {
  const flow = ['da_inviare', 'inviato', 'ricevuto']
  const idx = flow.indexOf(statoCorrente)
  if (idx < flow.length - 1) {
    return aggiornaOrdine(id, { stato: flow[idx + 1], ...extra })
  }
}

// ── RICEZIONE PER RIGA ────────────────────────────────────

// Normalizza un ordine vecchio (stato solo a livello ordine) al nuovo modello
// per riga. Gli ordini gia' segnati ricevuti ereditano il DDT su tutte le righe.
export function normalizzaRighe(ordine) {
  const righe = ordine.righe || []
  const giaRicevuto = ordine.stato === 'ricevuto'
  return righe.map(r => {
    if (r.ricevuta !== undefined) return r
    return giaRicevuto
      ? { ...r, ricevuta: true, ddtNumero: ordine.ddtNumero || '', ddtData: ordine.ddtData || '' }
      : { ...r, ricevuta: false }
  })
}

// Lo stato dell'ordine deriva dalle righe: nessuna arrivata resta "inviato",
// tutte arrivate diventa "ricevuto", in mezzo e' "parziale".
export function statoDaRighe(righe, statoAttuale) {
  if (!righe || righe.length === 0) return statoAttuale
  const arrivate = righe.filter(r => r.ricevuta).length
  if (arrivate === 0) return statoAttuale === 'da_inviare' ? 'da_inviare' : 'inviato'
  if (arrivate === righe.length) return 'ricevuto'
  return 'parziale'
}

// Registra la ricezione delle righe indicate con un unico DDT.
export async function registraRicezione(ordine, indiciRighe, ddtNumero, ddtData) {
  const righe = normalizzaRighe(ordine).map((r, i) =>
    indiciRighe.includes(i)
      ? { ...r, ricevuta: true, ddtNumero, ddtData }
      : r
  )
  return aggiornaOrdine(ordine.id, { righe, stato: statoDaRighe(righe, ordine.stato) })
}

// Annulla la ricezione di una singola riga (correzione di un errore).
export async function annullaRicezioneRiga(ordine, indice) {
  const righe = normalizzaRighe(ordine).map((r, i) =>
    i === indice ? { ...r, ricevuta: false, ddtNumero: '', ddtData: '' } : r
  )
  return aggiornaOrdine(ordine.id, { righe, stato: statoDaRighe(righe, ordine.stato) })
}

export async function eliminaOrdine(id) {
  return deleteDoc(doc(db, COLL, id))
}
