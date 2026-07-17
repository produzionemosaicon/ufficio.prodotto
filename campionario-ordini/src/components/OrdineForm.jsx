import React, { useState, useMemo } from 'react'
import { X, Save, Footprints, Layers, Puzzle } from 'lucide-react'
import { creaOrdine, aggiornaOrdine } from '../lib/ordini'
import { TAGLIE } from '../lib/generatePdf'

const TAGLIE_DISPLAY = {
  '34.5':'34½','35.5':'35½','36.5':'36½','37.5':'37½','38.5':'38½','39.5':'39½',
  '40.5':'40½','41.5':'41½','42.5':'42½','43.5':'43½','44.5':'44½','45.5':'45½'
}

const TIPI_ARTICOLO = [
  { key: 'Suola',      icon: Footprints, sub: 'Numerata 34 → 46' },
  { key: 'Pellame',    icon: Layers,     sub: 'MQ o ML' },
  { key: 'Accessorio', icon: Puzzle,     sub: 'N° pezzi' },
]

const SPEDIZIONI = ['CAMION - BY TRUCK', 'CORRIERE GLS', 'CORRIERE DHL', 'CORRIERE BRT', 'FRANCO FABBRICA', 'RITIRO NOSTRO MEZZO']
const TERMINI    = ['PORTO FRANCO', 'PORTO ASSEGNATO', 'EX WORKS']
const PAGAMENTI  = ['RIBA 60 GG. FM', 'RIBA 30 GG. FM', 'BONIFICO 30 GG', 'BONIFICO 60 GG', 'BONIFICO VISTA FATTURA']

const empty = {
  stagione: 'SS 2027',
  tipoAttivita: 'Campionario',
  fornitore: '',
  fornitoreIndirizzo: '',
  fornitoreEmail: '',
  tipoArticolo: 'Suola',
  articolo: '',
  colore: '',
  lavorazione: '',
  modello: '',
  brand: '',
  numerata: {},
  quantita: '',
  unitaMisura: 'MQ',
  spedizione: 'CAMION - BY TRUCK',
  termini: 'PORTO FRANCO',
  pagamento: 'RIBA 60 GG. FM',
  dataConsegna: '',
  note: '',
}

export default function OrdineForm({ ordine, onClose }) {
  const isEdit = !!ordine?.id
  const [form, setForm] = useState(isEdit ? {
    ...empty,
    ...ordine,
    numerata: ordine.numerata || {},
    dataConsegna: ordine.dataConsegna
      ? (ordine.dataConsegna?.toDate
          ? ordine.dataConsegna.toDate().toISOString().split('T')[0]
          : ordine.dataConsegna)
      : '',
  } : empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setTaglia(t, v) {
    setForm(f => ({ ...f, numerata: { ...f.numerata, [t]: v.replace(/\D/g, '') } }))
  }

  const totalePaia = useMemo(() =>
    Object.values(form.numerata).reduce((s, v) => s + (Number(v) || 0), 0),
    [form.numerata])

  async function handleSave() {
    if (!form.fornitore.trim()) { setError('Inserisci il fornitore'); return }
    if (!form.articolo.trim())  { setError("Inserisci la descrizione dell'articolo"); return }
    if (form.tipoArticolo === 'Suola' && totalePaia === 0) {
      setError('Inserisci almeno una quantità nella numerata'); return
    }
    if (form.tipoArticolo !== 'Suola' && !form.quantita) {
      setError('Inserisci la quantità'); return
    }
    setError('')
    setSaving(true)
    try {
      // Normalizza dati in base al tipo
      const dati = { ...form }
      if (form.tipoArticolo === 'Suola') {
        dati.quantita = totalePaia
        dati.unitaMisura = 'PA'
      } else {
        dati.numerata = {}
        if (form.tipoArticolo === 'Accessorio') dati.unitaMisura = 'PZ'
      }
      if (isEdit) await aggiornaOrdine(ordine.id, dati)
      else        await creaOrdine(dati)
      onClose()
    } catch (e) {
      setError('Errore salvataggio: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <div className="modal-title">{isEdit ? 'Modifica ordine' : 'Nuovo ordine'}</div>
            {isEdit && <div className="modal-sub">{ordine.numeroOrdine}</div>}
          </div>
          <button className="icon-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="form-error">{error}</div>}

          {/* STAGIONE + TIPO ATTIVITA */}
          <div className="form-section-title">Stagione e tipo attività</div>
          <div className="form-row col2">
            <div className="form-group">
              <label>Stagione *</label>
              <input value={form.stagione} onChange={e => set('stagione', e.target.value)} placeholder="es. SS 2027" />
            </div>
            <div className="form-group">
              <label>Tipo attività</label>
              <div className="radio-pills">
                {['Campionario', 'Prototipia'].map(t => (
                  <button key={t} type="button"
                    className={`radio-pill ${form.tipoAttivita === t ? 'active' : ''}`}
                    onClick={() => set('tipoAttivita', t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FORNITORE */}
          <div className="form-section-title">Fornitore</div>
          <div className="form-row col2">
            <div className="form-group">
              <label>Nome fornitore *</label>
              <input value={form.fornitore} onChange={e => set('fornitore', e.target.value)} placeholder="es. Suolificio Gloria Srl" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.fornitoreEmail} onChange={e => set('fornitoreEmail', e.target.value)} placeholder="ordini@fornitore.it" />
            </div>
          </div>
          <div className="form-group">
            <label>Indirizzo</label>
            <input value={form.fornitoreIndirizzo} onChange={e => set('fornitoreIndirizzo', e.target.value)} placeholder="Via, CAP, Città, Provincia" />
          </div>

          {/* TIPO ARTICOLO */}
          <div className="form-section-title">Tipo articolo</div>
          <div className="tipo-grid">
            {TIPI_ARTICOLO.map(({ key, icon: Icon, sub }) => (
              <button key={key} type="button"
                className={`tipo-btn ${form.tipoArticolo === key ? 'active' : ''}`}
                onClick={() => set('tipoArticolo', key)}>
                <Icon size={20} />
                <span>{key}</span>
                <small>{sub}</small>
              </button>
            ))}
          </div>

          {/* ARTICOLO */}
          <div className="form-section-title">Articolo — {form.tipoArticolo}</div>
          <div className="form-group">
            <label>Descrizione articolo *</label>
            <input value={form.articolo} onChange={e => set('articolo', e.target.value)}
              placeholder="es. SUOLA DVN-W13 PER ZEPPA CUOIO" />
          </div>
          <div className="form-row col2">
            <div className="form-group">
              <label>Colore / Finitura</label>
              <input value={form.colore} onChange={e => set('colore', e.target.value)} placeholder="es. BISCOTTO TAMPONATO 40974" />
            </div>
            <div className="form-group">
              <label>Modello / Linea</label>
              <input value={form.modello} onChange={e => set('modello', e.target.value)} placeholder="es. DVN ELEG. DONNA" />
            </div>
          </div>
          <div className="form-group">
            <label>Note lavorazione</label>
            <input value={form.lavorazione} onChange={e => set('lavorazione', e.target.value)}
              placeholder="es. FRESA 45 + CANALINO + RIFINITO PIANTA" />
          </div>

          {/* QUANTITA — condizionale per tipo */}
          {form.tipoArticolo === 'Suola' ? (
            <>
              <div className="form-section-title">
                Numerata — quantità per taglia (paia)
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
                        className={`taglia-input ${form.numerata[t] ? 'has-val' : ''}`}
                        value={form.numerata[t] || ''}
                        onChange={e => setTaglia(t, e.target.value)}
                        inputMode="numeric"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : form.tipoArticolo === 'Pellame' ? (
            <>
              <div className="form-section-title">Quantità pellame</div>
              <div className="form-row col2">
                <div className="form-group">
                  <label>Quantità *</label>
                  <input type="number" min="0" step="0.5" value={form.quantita}
                    onChange={e => set('quantita', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Unità di misura</label>
                  <div className="radio-pills">
                    {['MQ', 'ML'].map(u => (
                      <button key={u} type="button"
                        className={`radio-pill ${form.unitaMisura === u ? 'active' : ''}`}
                        onClick={() => set('unitaMisura', u)}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-section-title">Quantità accessorio</div>
              <div className="form-group" style={{ maxWidth: 200 }}>
                <label>Numero pezzi *</label>
                <input type="number" min="0" value={form.quantita}
                  onChange={e => set('quantita', e.target.value)} placeholder="0" />
              </div>
            </>
          )}

          {/* SPEDIZIONE */}
          <div className="form-section-title">Spedizione e pagamento</div>
          <div className="form-row col2">
            <div className="form-group">
              <label>Modalità spedizione</label>
              <select value={form.spedizione} onChange={e => set('spedizione', e.target.value)}>
                {SPEDIZIONI.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Termini consegna</label>
              <select value={form.termini} onChange={e => set('termini', e.target.value)}>
                {TERMINI.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row col2">
            <div className="form-group">
              <label>Pagamento</label>
              <select value={form.pagamento} onChange={e => set('pagamento', e.target.value)}>
                {PAGAMENTI.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Data consegna richiesta</label>
              <input type="date" value={form.dataConsegna} onChange={e => set('dataConsegna', e.target.value)} />
            </div>
          </div>

          {/* NOTE */}
          <div className="form-section-title">Note aggiuntive</div>
          <div className="form-group">
            <label>Istruzioni speciali (compariranno in evidenza nel PDF)</label>
            <textarea rows={2} value={form.note} onChange={e => set('note', e.target.value)}
              placeholder="es. Chiedere campionatura colore prima di procedere" />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={13} />
            {saving ? 'Salvataggio…' : isEdit ? 'Salva modifiche' : 'Crea ordine'}
          </button>
        </div>
      </div>
    </div>
  )
}
