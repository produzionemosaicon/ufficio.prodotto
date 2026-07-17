import React, { useState } from 'react'
import { X, Edit2, Send, CheckCircle, FileDown, Trash2, AlertTriangle } from 'lucide-react'
import StatusPill from './StatusPill'
import { avanzaStato, eliminaOrdine } from '../lib/ordini'
import { generateOrdinePDF, TAGLIE } from '../lib/generatePdf'

const TAGLIE_DISPLAY = {
  '34.5':'34½','35.5':'35½','36.5':'36½','37.5':'37½','38.5':'38½','39.5':'39½',
  '40.5':'40½','41.5':'41½','42.5':'42½','43.5':'43½','44.5':'44½','45.5':'45½'
}

const FLOW = ['da_inviare', 'inviato', 'ricevuto']
const FLOW_LABELS = { da_inviare: 'Da inviare', inviato: 'Inviato', ricevuto: 'Ricevuto' }
const NEXT_LABEL = { da_inviare: 'Segna Inviato', inviato: 'Segna Ricevuto', ricevuto: null }

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

  const statoIdx = FLOW.indexOf(ordine.stato)
  const nextLabel = NEXT_LABEL[ordine.stato]
  const taglieCompilate = ordine.numerata
    ? TAGLIE.filter(t => ordine.numerata[t])
    : []

  async function handleAvanza() {
    setLoading(true)
    await avanzaStato(ordine.id, ordine.stato)
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
          <div className="panel-title">{ordine.articolo}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
            <StatusPill stato={ordine.stato} />
            <span className="attivita-tag">{ordine.tipoAttivita || 'Campionario'}</span>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><X size={14} /></button>
      </div>

      <div className="panel-body">
        <div className="panel-section-title">Avanzamento</div>
        <div className="status-flow">
          {FLOW.map((s, i) => (
            <div key={s} className={`flow-step ${i <= statoIdx ? 'flow-done' : ''} ${i === statoIdx ? 'flow-active' : ''}`}>
              {FLOW_LABELS[s]}
            </div>
          ))}
        </div>

        <div className="panel-section-title">Fornitore</div>
        <Field label="Nome" value={ordine.fornitore} />
        {ordine.fornitoreIndirizzo && <Field label="Indirizzo" value={ordine.fornitoreIndirizzo} />}
        {ordine.fornitoreEmail && <Field label="Email" value={ordine.fornitoreEmail} />}

        <div className="panel-section-title">Articolo — {ordine.tipoArticolo}</div>
        <Field label="Descrizione" value={ordine.articolo} />
        {ordine.colore && <Field label="Colore" value={ordine.colore} />}
        {ordine.lavorazione && <Field label="Lavorazione" value={ordine.lavorazione} />}
        {ordine.modello && <Field label="Modello" value={ordine.modello} />}
        <Field label="Stagione" value={`${ordine.stagione} · ${ordine.tipoAttivita || ''}`} />

        {/* NUMERATA per suole */}
        {ordine.tipoArticolo === 'Suola' && taglieCompilate.length > 0 ? (
          <>
            <div className="panel-section-title">
              Numerata — Totale {ordine.quantita} PA
            </div>
            <div className="numerata-view">
              {taglieCompilate.map(t => (
                <div key={t} className="numerata-chip">
                  <span className="nc-taglia">{TAGLIE_DISPLAY[t] || t}</span>
                  <span className="nc-qty">{ordine.numerata[t]}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Field label="Quantità" value={`${ordine.quantita} ${ordine.unitaMisura || ''}`} mono />
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
        {nextLabel && (
          <button className="btn-primary-sm" onClick={handleAvanza} disabled={loading}>
            {ordine.stato === 'da_inviare' ? <Send size={13} /> : <CheckCircle size={13} />}
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  )
}
