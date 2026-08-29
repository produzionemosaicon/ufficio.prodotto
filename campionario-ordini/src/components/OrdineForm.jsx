import React, { useState, useMemo } from 'react'
import { X, Save, Footprints, Layers, Puzzle, Plus, Trash2, Box } from 'lucide-react'
import { creaOrdine, aggiornaOrdine } from '../lib/ordini'
import { TAGLIE, NUMERATA_TIPI } from '../lib/generatePdf'

const TAGLIE_DISPLAY = {
  '34.5':'34½','35.5':'35½','36.5':'36½','37.5':'37½','38.5':'38½','39.5':'39½',
  '40.5':'40½','41.5':'41½','42.5':'42½','43.5':'43½','44.5':'44½','45.5':'45½'
}

const TIPI_ARTICOLO = [
  { key: 'Suola',      icon: Footprints, sub: 'Numerata 34 → 46' },
  { key: 'Tacco',      icon: Footprints, sub: 'Tacco + Sottotacco' },
  { key: 'Forme',      icon: Box,        sub: 'Numerata (paia)' },
  { key: 'Pellame',    icon: Layers,     sub: 'MQ o ML' },
  { key: 'Accessorio', icon: Puzzle,     sub: 'N° pezzi' },
]

const SPEDIZIONI = ['CAMION - BY TRUCK', 'CORRIERE GLS', 'CORRIERE DHL', 'CORRIERE BRT', 'FRANCO FABBRICA', 'RITIRO NOSTRO MEZZO']
const TERMINI    = ['PORTO FRANCO', 'PORTO ASSEGNATO', 'EX WORKS']
const PAGAMENTI  = ['RIBA 60 GG. FM', 'RIBA 30 GG. FM', 'BONIFICO 30 GG', 'BONIFICO 60 GG', 'BONIFICO VISTA FATTURA']
const BRANDS     = ['', 'MOMONI', 'CHANEL', 'HERMÈS', 'MIUMIU', 'DRIES VAN NOTEN', 'PROENZA', 'CHROME HEARTS', 'PIERRE HARDY']
const OPERATORI  = ['', 'MASSIMILIANO', 'MASSIMO', 'MATTEO', 'IRENE', 'ELENA', 'SALVATORE', 'MARTA']
export const ATTIVITA = ['Campionario', 'Prototipia', 'Industrializzazione', 'Strutture']

const emptyRiga = {
  tipoArticolo: 'Suola',
  articolo: '',
  colore: '',
  lavorazione: '',
  modello: '',
  numerata: {},
  quantita: '',
  unitaMisura: 'MQ',
}

const emptyOrder = {
  stagione: 'SS 2027',
  tipoAttivita: 'Campionario',
  fornitore: '',
  brand: '',
  spedizione: 'CAMION - BY TRUCK',
  termini: 'PORTO FRANCO',
  pagamento: 'RIBA 60 GG. FM',
  dataConsegna: '',
  note: '',
  ordinatoDa: '',
  righe: [{ ...emptyRiga }],
}

function RigaEditor({ riga, index, total, onChange, onRemove }) {
  function set(k, v) { onChange(index, { ...riga, [k]: v }) }
  function setTaglia(t, v) {
    onChange(index, { ...riga, numerata: { ...riga.numerata, [t]: v.replace(/\D/g, '') } })
  }

  const totalePaia = useMemo(() =>
    Object.values(riga.numerata || {}).reduce((s, v) => s + (Number(v) || 0), 0),
    [riga.numerata])

  return (
    <div className="riga-editor">
      <div className="riga-header">
        <span className="riga-num">Riga {index + 1}</span>
        {total > 1 && (
          <button type="button" className="btn-danger-sm" onClick={() => onRemove(index)}>
            <Trash2 size={11} /> Rimuovi
          </button>
        )}
      </div>

      <div className="tipo-grid">
        {TIPI_ARTICOLO.map(({ key, icon: Icon, sub }) => (
          <button key={key} type="button"
            className={`tipo-btn ${riga.tipoArticolo === key ? 'active' : ''}`}
            onClick={() => set('tipoArticolo', key)}>
            <Icon size={18} />
            <span>{key}</span>
            <small>{sub}</small>
          </button>
        ))}
      </div>

      <div className="form-group">
        <label>Descrizione articolo *</label>
        <input value={riga.articolo} onChange={e => set('articolo', e.target.value)} />
      </div>
      <div className="form-row col2">
        <div className="form-group">
          <label>Colore / Finitura</label>
          <input value={riga.colore} onChange={e => set('colore', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Modello / Linea</label>
          <input value={riga.modello} onChange={e => set('modello', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>Note lavorazione</label>
        <input value={riga.lavorazione} onChange={e => set('lavorazione', e.target.value)} />
      </div>

      {NUMERATA_TIPI.includes(riga.tipoArticolo) ? (
        <>
          <div className="form-section-sub">
            Numerata — paia per taglia
            <span className="totale-badge">Totale: {totalePaia} PA</span>
          </div>
          <div className="numerata-scroll">
            <div className="numerata-strip">
              {TAGLIE.map(t => (
                <div key={t} className="taglia-cell">
                  <div className={`taglia-label ${t.includes('.') ? 'half' : ''}`}>
                    {TAGLIE_DISPLAY[t] || t}
                  </div>
                  <input
                    className={`taglia-input ${(riga.numerata || {})[t] ? 'has-val' : ''}`}
                    value={(riga.numerata || {})[t] || ''}
                    onChange={e => setTaglia(t, e.target.value)}
                    inputMode="numeric"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : riga.tipoArticolo === 'Pellame' ? (
        <div className="form-row col2">
          <div className="form-group">
            <label>Quantità *</label>
            <input type="number" min="0" step="0.5" value={riga.quantita}
              onChange={e => set('quantita', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Unità di misura</label>
            <div className="radio-pills">
              {['MQ', 'ML'].map(u => (
                <button key={u} type="button"
                  className={`radio-pill ${riga.unitaMisura === u ? 'active' : ''}`}
                  onClick={() => set('unitaMisura', u)}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="form-group" style={{ maxWidth: 200 }}>
          <label>Numero pezzi *</label>
          <input type="number" min="0" value={riga.quantita}
            onChange={e => set('quantita', e.target.value)} />
        </div>
      )}
    </div>
  )
}

export default function OrdineForm({ ordine, onClose }) {
  const isEdit = !!ordine?.id
  const [form, setForm] = useState(isEdit ? {
    ...emptyOrder,
    ...ordine,
    righe: ordine.righe || [{ ...emptyRiga }],
    dataConsegna: ordine.dataConsegna
      ? (ordine.dataConsegna?.toDate
          ? ordine.dataConsegna.toDate().toISOString().split('T')[0]
          : ordine.dataConsegna)
      : '',
  } : emptyOrder)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [nuovoBrand, setNuovoBrand] = useState(
    isEdit && ordine.brand && !BRANDS.includes(ordine.brand)
  )
  const [nuovoOperatore, setNuovoOperatore] = useState(
    isEdit && ordine.ordinatoDa && !OPERATORI.includes(ordine.ordinatoDa)
  )

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function updateRiga(idx, riga) {
    setForm(f => ({ ...f, righe: f.righe.map((r, i) => i === idx ? riga : r) }))
  }
  function addRiga() {
    setForm(f => ({ ...f, righe: [...f.righe, { ...emptyRiga }] }))
  }
  function removeRiga(idx) {
    setForm(f => ({ ...f, righe: f.righe.filter((_, i) => i !== idx) }))
  }

  async function handleSave() {
    if (!form.ordinatoDa.trim()) { setError('Seleziona o inserisci chi sta ordinando'); return }
    if (!form.fornitore.trim()) { setError('Inserisci il fornitore'); return }

    for (let i = 0; i < form.righe.length; i++) {
      const r = form.righe[i]
