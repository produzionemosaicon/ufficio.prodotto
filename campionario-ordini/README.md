# Campionario Ordini — Mosaicon Group

Web app per la gestione degli ordini liberi ai fornitori (campionario e prototipia), con generazione PDF automatica in stile gestionale.

---

## ⚙️ SETUP — 5 passi

### 1. Installa le dipendenze
```bash
npm install
```

### 2. Crea il progetto Firebase
1. Vai su https://console.firebase.google.com
2. Crea progetto → nome es. `mosaicon-campionario`
3. Nel menu laterale: **Firestore Database → Crea database** → modalità produzione → eu-west
4. **Project Settings (ingranaggio) → Your apps → icona Web `</>`** → registra app → copia il blocco `firebaseConfig`

### 3. Incolla la configurazione
Apri `src/lib/firebase.js` e sostituisci i valori segnaposto con quelli copiati:
```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "mosaicon-campionario.firebaseapp.com",
  projectId: "mosaicon-campionario",
  storageBucket: "mosaicon-campionario.appspot.com",
  messagingSenderId: "...",
  appId: "..."
}
```

### 4. Regole Firestore
Firebase Console → Firestore → **Regole** → incolla e pubblica:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
*(uso interno senza login — come le altre app Mosaicon)*

### 5. Avvia
```bash
npm run dev          # sviluppo locale su http://localhost:5173
npm run build        # build di produzione nella cartella dist/
```

---

## 🚀 DEPLOY SU VERCEL (consigliato)

1. Carica il progetto su GitHub (org `produzionemosaicon`)
2. Su vercel.com → **New Project** → importa il repository
3. Framework: **Vite** (rilevato in automatico) → Deploy
4. Condividi l'URL con i colleghi — funziona anche da telefono

---

## ✨ FUNZIONALITÀ

| Funzione | Dettaglio |
|---|---|
| **Numero ordine univoco** | Automatico e progressivo: `ORD-2027-0001` — contatore condiviso su Firestore, nessun duplicato anche con più utenti |
| **Stagione + attività** | Campo stagione libero (es. SS 2027) + scelta **Campionario / Prototipia** |
| **3 tipi articolo** | **Suola** → numerata 34→46 con mezze taglie consecutive · **Pellame** → MQ o ML · **Accessorio** → pezzi |
| **Ordini liberi** | Solo descrizione articolo, nessun codice codificato |
| **PDF fornitore** | Un clic → PDF con dati Mosaicon Shoes SRL, spedizione, griglia taglie, condizioni d'acquisto complete |
| **Stati** | Da inviare → Inviato → Ricevuto, avanzamento con un clic |
| **Filtri e ricerca** | Per stato, tipo articolo, testo libero |
| **Scaduti** | Date consegna superate evidenziate in rosso |
| **Real-time** | Modifiche visibili istantaneamente a tutti i colleghi |

## 📄 IL PDF CONTIENE

- Intestazione **MOSAICON SHOES SRL** — Corso Novara 171, Vigevano, P.IVA, telefono
- Numero ordine + data + pagina
- Box **Stagione / Campionario o Prototipia** + box fornitore con indirizzo
- Riga **Spedizione / Consegna / Pagamento / Data richiesta**
- Descrizione articolo con colore, lavorazione, linea
- **Griglia taglie consecutive** (per suole) con totale paia, oppure quantità MQ/ML/PZ
- Note utente in evidenza + **condizioni d'acquisto complete** (esenzione IVA Art.8, dichiarazione di intento, indicazioni numero ordine, informativa privacy D.Lgs.196/2003)

## 🗂 STRUTTURA DATI FIRESTORE

```
ordini/{id}
  numeroOrdine     "ORD-2027-0001"
  stagione         "SS 2027"
  tipoAttivita     "Campionario" | "Prototipia"
  fornitore        "Suolificio Gloria Srl"
  fornitoreIndirizzo, fornitoreEmail
  tipoArticolo     "Suola" | "Pellame" | "Accessorio"
  articolo         descrizione libera
  colore, lavorazione, modello
  numerata         { "34": 9, "34.5": 3, ... }   ← solo suole
  quantita         totale paia | mq | ml | pezzi
  unitaMisura      "PA" | "MQ" | "ML" | "PZ"
  spedizione, termini, pagamento
  dataConsegna     data richiesta
  note             istruzioni speciali
  stato            "da_inviare" | "inviato" | "ricevuto"
  createdAt, updatedAt

meta/ordineCounter
  lastN            contatore progressivo numerazione
```

## ❓ PROBLEMI COMUNI

- **"Missing or insufficient permissions"** → regole Firestore non pubblicate (passo 4)
- **Pagina bianca** → config `firebase.js` incompleta (passo 3)
- **Numero ordine non parte da 0001** → cancella il documento `meta/ordineCounter` da Firebase Console
