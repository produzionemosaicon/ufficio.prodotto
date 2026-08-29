import React, { useState } from 'react'
import { X, Edit2, Send, CheckCircle, FileDown, Trash2, AlertTriangle, PackageCheck } from 'lucide-react'
import StatusPill from './StatusPill'
import { avanzaStato, eliminaOrdine } from '../lib/ordini'
import { generateOrdinePDF, TAGLIE, NUMERATA_TIPI } from '../lib/generatePdf'

const TAGLIE_DISPLAY = {
  '34.5':'34½','35.5':'35½','36.5':'36½','37.5':'37½','38.5':'38½','39.5':'39½',
  '40.5':'40½','41.5':'41½','42.5':'42½','43.5':'43½','44.5':'44½','45.5':'45½'
}

const FLOW = ['da_inviare', 'inviato', 'ricevuto']
const FLOW_LABELS = { da_inviare: 'Da inviare', inviato: 'Inviato', ricevuto: 'Ricevuto' }

function fmt(val) {
  if (!val) return '—'
  if (val?.toDate) return val.toDate().toLocaleDateString('it-IT')
  if (val instanceof Date) return val.toLocaleDateString('it-IT')
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = val.split('-')
    return `${d}/${m}/${y}`
  }
  return String(val)
}

function isScaduto(val) {
  if (!val) return false
  let d
  if (val?.toDate) d = val.toDate()
  else if (typeof val === 'string') d = new Date(val)
  else d = val
  return d < new Date()
}

function Field({ label, value, mono }) {
  return (
    <div className="panel-field">
      <span className="field-label">{label}</span>
      <span className={`field-value${mono ? ' mono' : ''}`}>{value || '—'}</span>
    </div>
  )
}

export default function DettaglioPanel({ ordine, onClose, onEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDdt, setShowDdt] = useState(false)
  const [ddtNumero, setDdtNumero] = useState('')
  const [ddtData, setDdtData] = useState(new Date().toISOString().split('T')[0])
  const [ddtError, setDdtError] = useState('')

  const statoIdx = FLOW.indexOf(ordine.stato)
  const righe = ordine.righe || []
  const scaduto = ordine.stato !== 'ricevuto' && isScaduto(ordine.dataConsegna)

  async function handleInviato() {
    setLoading(true)
    await avanzaStato(ordine.id, 'da_inviare')
    setLoading(false)
  }

  async function handleRicevuto() {
    if (!ddtNumero.trim()) { setDdtError('Inserisci il numero DDT'); return }
    if (!ddtData) { setDdtError('Inserisci la data di arrivo'); return }
    setDdtError('')
    setLoading(true)
    await avanzaStato(ordine.id, 'inviato', { ddtNumero: ddtNumero.trim(), ddtData })
    setShowDdt(false)
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    await eliminaOrdine(ordine.id)
    onClose()
  }

  return (
    <div className="detail-panel">
      <div className="panel-header">
        <div>
          <div className="panel-order-id">{ordine.numeroOrdine}</div>
          <div className="panel-title">{ordine.fornitore}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusPill stato={ordine.stato} />
            <span className="attivita-tag">{ordine.tipoAttivita || 'Campionario'}</span>
            {ordine.brand && <span className="attivita-tag">{ordine.brand}</span>}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><X size={14} /></button>
      </div>

      <div className="panel-body">
        {scaduto && (
          <div className="alert-scaduto">
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <div>
              <strong>Ordine scaduto — da sollecitare</strong>
              <div style={{ fontSize: 11, marginTop: 2 }}>
                Consegna richiesta il {fmt(ordine.dataConsegna)}, non ancora ricevuto.
              </div>
            </div>
          </div>
        )}

        <div className="panel-section-title">Avanzamento</div>
        <div className="status-flow">
          {FLOW.map((s, i) => (
            <div key={s} className={`flow-step ${i <= statoIdx ? 'flow-done' : ''} ${i === statoIdx ? 'flow-active' : ''}`}>
              {FLOW_LABELS[s]}
            </div>
          ))}
        </div>

        {ordine.stato === 'ricevuto' && ordine.ddtNumero && (
          <>
            <div className="panel-section-title">Ricezione merce</div>
            <Field label="N° DDT" value={ordine.ddtNumero} mono />
            <Field label="Data arrivo" value={fmt(ordine.ddtData)} mono />
          </>
        )}

        <div className="panel-section-title">Fornitore</div>
        <Field label="Nome" value={ordine.fornitore} />
        <Field label="Stagione" value={`${ordine.stagione} · ${ordine.tipoAttivita || ''}`} />
        {ordine.brand && <Field label="Brand" value={ordine.brand} />}

        {righe.map((r, i) => {
          const taglieCompilate = r.numerata ? TAGLIE.filter(t => r.numerata[t]) : []
          return (
            <div key={i}>
              <div className="panel-section-title">Riga {i + 1} — {r.tipoArticolo}</div>
              <Field label="Articolo" value={r.articolo} />
              {r.colore && <Field label="Colore" value={r.colore} />}
              {r.lavorazione && <Field label="Lavorazione" value={r.lavorazione} />}
              {r.modello && <Field label="Modello" value={r.modello} />}

              {NUMERATA_TIPI.includes(r.tipoArticolo) && taglieCompilate.length > 0 ? (
                <>
                  <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, margin: '6px 0 4px' }}>
                    Numerata — Totale {r.quantita} PA
                  </div>
                  <div className="numerata-view">
                    {taglieCompilate.map(t => (
                      <div key={t} className="numerata-chip">
                        <span className="nc-taglia">{TAGLIE_DISPLAY[t] || t}</span>
                        <span className="nc-qty">{r.numerata[t]}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <Field label="Quantità" value={`${r.quantita} ${r.unitaMisura || ''}`} mono />
              )}
            </div>
          )
        })}

        {ordine.ordinatoDa && (
          <>
            <div className="panel-section-title">Operatore</div>
            <Field label="Ordinato da" value={ordine.ordinatoDa} />
          </>
        )}

        <div className="panel-section-title">Spedizione</div>
        <Field label="Modalità" value={ordine.spedizione} />
        <Field label="Termini" value={ordine.termini} />
        <Field label="Pagamento" value={ordine.pagamento} />
        <Field label="Consegna richiesta" value={fmt(ordine.dataConsegna)} mono />
        <Field label="Creato il" value={fmt(ordine.createdAt)} mono />

        {ordine.note && (
          <>
            <div className="panel-section-title">Note</div>
            <div className="note-box">{ordine.note}</div>
          </>
        )}

        {showDdt && (
          <div className="ddt-form">
            <div className="ddt-title">
              <PackageCheck size={14} /> Registra ricezione merce
            </div>
            {ddtError && <div className="form-error" style={{ marginBottom: 10 }}>{ddtError}</div>}
            <div className="form-group">
              <label>Numero DDT *</label>
              <input value={ddtNumero} onChange={e => setDdtNumero(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label>Data di arrivo *</label>
              <input type="date" value={ddtData} onChange={e => setDdtData(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary-sm" onClick={handleRicevuto} disabled={loading}>
                <CheckCircle size={13} /> Conferma ricezione
              </button>
              <button className="btn-secondary" onClick={() => { setShowDdt(false); setDdtError('') }}>
                Annulla
              </button>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div className="delete-confirm">
            <AlertTriangle size={14} style={{ color: '#C0392B', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: '#C0392B', marginBottom: 4 }}>Eliminare l'ordine?</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>L'azione è irreversibile.</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button className="btn-danger-sm" onClick={handleDelete} disabled={loading}>Elimina</button>
                <button className="btn-secondary-sm" onClick={() => setConfirmDelete(false)}>Annulla</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel-footer">
        <button className="btn-secondary" onClick={() => generateOrdinePDF(ordine)} title="Scarica PDF ordine">
          <FileDown size={13} /> PDF
        </button>
        <button className="btn-secondary" onClick={() => onEdit(ordine)} title="Modifica">
          <Edit2 size={13} /> Modifica
        </button>
        {!confirmDelete && (
          <button className="btn-danger" onClick={() => setConfirmDelete(true)} title="Elimina">
            <Trash2 size={13} />
          </button>
        )}
        {ordine.stato === 'da_inviare' && (
          <button className="btn-primary-sm" onClick={handleInviato} disabled={loading}>
            <Send size={13} /> Segna Inviato
          </button>
        )}
        {ordine.stato === 'inviato' && !showDdt && (
          <button className="btn-primary-sm" onClick={() => setShowDdt(true)} disabled={loading}>
            <CheckCircle size={13} /> Segna Ricevuto
          </button>
        )}
      </div>
    </div>
  )
}
