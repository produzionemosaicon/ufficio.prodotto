import React, { useState, useMemo } from 'react'
import { X, Save, Footprints, Layers, Puzzle, Plus, Trash2 } from 'lucide-react'
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
const BRANDS     = ['', 'MOMONI', 'CHANEL', 'HERMÈS', 'MIUMIU', 'DRIES VAN NOTEN', 'PROENZA', 'CHROME HEARTS', 'PIERRE HARDY', 'ALTRO']

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
  fornitoreIndirizzo: '',
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

      {riga.tipoArticolo === 'Suola' ? (
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
    if (!form.ordinatoDa.trim()) { setError('Inserisci chi sta ordinando'); return }
    if (!form.fornitore.trim()) { setError('Inserisci il fornitore'); return }

    for (let i = 0; i < form.righe.length; i++) {
      const r = form.righe[i]
      if (!r.articolo.trim()) { setError(`Riga ${i+1}: inserisci la descrizione articolo`); return }
      if (r.tipoArticolo === 'Suola') {
        const tot = Object.values(r.numerata || {}).reduce((s, v) => s + (Number(v) || 0), 0)
        if (tot === 0) { setError(`Riga ${i+1}: inserisci almeno una quantità nella numerata`); return }
      } else if (!r.quantita) {
        setError(`Riga ${i+1}: inserisci la quantità`); return
      }
    }

    setError('')
    setSaving(true)
    try {
      const righe = form.righe.map(r => {
        const nr = { ...r }
        if (r.tipoArticolo === 'Suola') {
          nr.quantita = Object.values(r.numerata || {}).reduce((s, v) => s + (Number(v) || 0), 0)
          nr.unitaMisura = 'PA'
        } else {
          nr.numerata = {}
          if (r.tipoArticolo === 'Accessorio') nr.unitaMisura = 'PZ'
        }
        return nr
      })

      const dati = { ...form, righe }
      dati.quantita = righe.reduce((s, r) => s + (Number(r.quantita) || 0), 0)
      dati.unitaMisura = righe.length === 1 ? righe[0].unitaMisura : 'MIX'
      dati.tipoArticolo = righe.length === 1 ? righe[0].tipoArticolo : 'Misto'
      dati.articolo = righe.length === 1 ? righe[0].articolo : righe.map(r => r.articolo).join(' + ')

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

          <div className="form-section-title">Operatore</div>
          <div className="form-group" style={{ maxWidth: 300 }}>
            <label>Ordinato da *</label>
            <input value={form.ordinatoDa} onChange={e => set('ordinatoDa', e.target.value)} />
          </div>

          <div className="form-section-title">Stagione e tipo attività</div>
          <div className="form-row col3">
            <div className="form-group">
              <label>Stagione *</label>
              <input value={form.stagione} onChange={e => set('stagione', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Brand / Cliente</label>
              <select value={form.brand} onChange={e => set('brand', e.target.value)}>
                {BRANDS.map(b => <option key={b} value={b}>{b || '— seleziona —'}</option>)}
              </select>
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

          <div className="form-section-title">Fornitore</div>
          <div className="form-row col2">
            <div className="form-group">
              <label>Nome fornitore *</label>
              <input value={form.fornitore} onChange={e => set('fornitore', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Indirizzo</label>
              <input value={form.fornitoreIndirizzo} onChange={e => set('fornitoreIndirizzo', e.target.value)} />
            </div>
          </div>

          <div className="form-section-title">
            Righe ordine
            <span className="totale-badge">{form.righe.length} {form.righe.length === 1 ? 'riga' : 'righe'}</span>
          </div>

          {form.righe.map((r, i) => (
            <RigaEditor
              key={i}
              riga={r}
              index={i}
              total={form.righe.length}
              onChange={updateRiga}
              onRemove={removeRiga}
            />
          ))}

          <button type="button" className="btn-add-riga" onClick={addRiga}>
            <Plus size={13} /> Aggiungi riga
          </button>

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

          <div className="form-section-title">Note aggiuntive</div>
          <div className="form-group">
            <label>Istruzioni speciali (compariranno in evidenza nel PDF)</label>
            <textarea rows={2} value={form.note} onChange={e => set('note', e.target.value)} />
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
