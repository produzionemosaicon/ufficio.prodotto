import React, { useEffect, useState, useMemo } from 'react'
import {
  List, Clock, Send, CheckCircle, Package, Layers,
  Plus, Search, SlidersHorizontal, ChevronUp, ChevronDown
} from 'lucide-react'
import { subscribeOrdini } from './lib/ordini'
import StatusPill from './components/StatusPill'
import DettaglioPanel from './components/DettaglioPanel'
import OrdineForm from './components/OrdineForm'
import './App.css'

const STATO_LABELS = {
  all:        { label: 'Tutti gli ordini', icon: List },
  da_inviare: { label: 'Da inviare',       icon: Clock },
  inviato:    { label: 'Inviati',           icon: Send },
  ricevuto:   { label: 'Ricevuti',          icon: CheckCircle },
}
const TIPO_LABELS = {
  all:          { label: 'Tutti i tipi', icon: Layers },
  Suola:        { label: 'Suole',        icon: Package },
  Pellame:      { label: 'Pellami',      icon: Layers },
  Accessorio:   { label: 'Accessori',    icon: Package },
}

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

export default function App() {
  const [ordini, setOrdini] = useState([])
  const [filtroStato, setFiltroStato] = useState('all')
  const [filtroTipo, setFiltroTipo]   = useState('all')
  const [search, setSearch]           = useState('')
  const [selected, setSelected]       = useState(null)
  const [showForm, setShowForm]       = useState(false)
  const [editOrdine, setEditOrdine]   = useState(null)
  const [sortCol, setSortCol]         = useState('createdAt')
  const [sortDir, setSortDir]         = useState('desc')

  useEffect(() => {
    const unsub = subscribeOrdini(setOrdini)
    return unsub
  }, [])

  // Counts per sidebar
  const counts = useMemo(() => {
    const c = { all: ordini.length, da_inviare: 0, inviato: 0, ricevuto: 0, Suola: 0, Pellame: 0, Accessorio: 0 }
    ordini.forEach(o => {
      if (c[o.stato] !== undefined) c[o.stato]++
      if (c[o.tipoArticolo] !== undefined) c[o.tipoArticolo]++
    })
    return c
  }, [ordini])

  const scaduti = useMemo(() =>
    ordini.filter(o => o.stato !== 'ricevuto' && isScaduto(o.dataConsegna)).length, [ordini])

  const filtered = useMemo(() => {
    let list = [...ordini]
    if (filtroStato !== 'all') list = list.filter(o => o.stato === filtroStato)
    if (filtroTipo  !== 'all') list = list.filter(o => o.tipoArticolo === filtroTipo)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        o.fornitore?.toLowerCase().includes(q) ||
        o.articolo?.toLowerCase().includes(q)  ||
        o.modello?.toLowerCase().includes(q)   ||
        o.numeroOrdine?.toLowerCase().includes(q)
      )
    }
    // Sort
    list.sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol]
      if (av?.toDate) av = av.toDate()
      if (bv?.toDate) bv = bv.toDate()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [ordini, filtroStato, filtroTipo, search, sortCol, sortDir])

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return null
    return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
  }

  function openEdit(o) { setEditOrdine(o); setShowForm(true) }
  function closeForm()  { setShowForm(false); setEditOrdine(null) }

  return (
    <div className="app-shell">

      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">
            <List size={14} color="white" />
          </div>
          <div>
            <div className="logo-name">Campionario Ordini</div>
            <div className="logo-sub">Mosaicon Group</div>
          </div>
        </div>
        <div className="header-right">
          <span className="season-badge">SS 27</span>
          <div className="avatar">MG</div>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="nav-section-label">Stato</div>
        {Object.entries(STATO_LABELS).map(([k, { label, icon: Icon }]) => (
          <button key={k} className={`nav-item ${filtroStato === k ? 'active' : ''}`}
            onClick={() => setFiltroStato(k)}>
            <Icon size={14} />
            {label}
            <span className="nav-count">{counts[k] ?? 0}</span>
          </button>
        ))}

        <div className="nav-divider" />

        <div className="nav-section-label">Tipo</div>
        {Object.entries(TIPO_LABELS).map(([k, { label, icon: Icon }]) => (
          <button key={k} className={`nav-item ${filtroTipo === k ? 'active' : ''}`}
            onClick={() => setFiltroTipo(k)}>
            <Icon size={14} />
            {label}
            {k !== 'all' && <span className="nav-count">{counts[k] ?? 0}</span>}
          </button>
        ))}

        <div className="nav-divider" />
        <div className="sidebar-stats">
          <div className="nav-section-label" style={{ padding: '0 0 8px' }}>Riepilogo</div>
          <div className="stat-row">
            <span className="stat-label">Totale ordini</span>
            <span className="stat-val">{counts.all}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Scaduti / in ritardo</span>
            <span className="stat-val" style={{ color: scaduti > 0 ? '#C0392B' : undefined }}>{scaduti}</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className={`main ${selected ? 'with-panel' : ''}`}>
        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="page-title">
            {STATO_LABELS[filtroStato]?.label}
            <span className="count-badge">{filtered.length}</span>
          </div>
          <div className="search-box">
            <Search size={13} color="var(--text-muted)" />
            <input
              placeholder="Cerca fornitore, articolo…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => { setEditOrdine(null); setShowForm(true) }}>
            <Plus size={13} /> Nuovo ordine
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="stats-row">
          {[
            { k: 'all',        label: 'Totale',     cls: ''        },
            { k: 'da_inviare', label: 'Da inviare', cls: 'accent'  },
            { k: 'inviato',    label: 'Inviati',    cls: 'orange'  },
            { k: 'ricevuto',   label: 'Ricevuti',   cls: 'green'   },
          ].map(({ k, label, cls }) => (
            <div key={k} className={`stat-card ${filtroStato === k ? 'stat-active' : ''}`}
              onClick={() => setFiltroStato(k)} style={{ cursor: 'pointer' }}>
              <div className="stat-card-label">{label}</div>
              <div className={`stat-card-val ${cls}`}>{counts[k] ?? 0}</div>
            </div>
          ))}
        </div>

        {/* TABLE */}
        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <List size={32} color="var(--text-muted)" />
              <div>Nessun ordine trovato</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {search ? 'Prova a cambiare i termini di ricerca' : 'Crea il primo ordine con il pulsante in alto'}
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th onClick={() => toggleSort('numeroOrdine')} className="sortable">
                    N° Ordine <SortIcon col="numeroOrdine" />
                  </th>
                  <th onClick={() => toggleSort('fornitore')} className="sortable">
                    Fornitore <SortIcon col="fornitore" />
                  </th>
                  <th>Articolo</th>
                  <th>Tipo</th>
                  <th>Stagione</th>
                  <th onClick={() => toggleSort('quantita')} className="sortable">
                    Qtà <SortIcon col="quantita" />
                  </th>
                  <th onClick={() => toggleSort('dataConsegna')} className="sortable">
                    Consegna <SortIcon col="dataConsegna" />
                  </th>
                  <th onClick={() => toggleSort('stato')} className="sortable">
                    Stato <SortIcon col="stato" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const scad = o.stato !== 'ricevuto' && isScaduto(o.dataConsegna)
                  return (
                    <tr
                      key={o.id}
                      className={selected?.id === o.id ? 'selected' : ''}
                      onClick={() => setSelected(selected?.id === o.id ? null : o)}
                    >
                      <td className="td-mono">{o.numeroOrdine}</td>
                      <td><strong>{o.fornitore}</strong></td>
                      <td>{o.articolo}</td>
                      <td>
                        <span className={`type-tag ${o.tipoArticolo === 'Suola' ? 'mat' : o.tipoArticolo === 'Pellame' ? 'comp' : 'acc'}`}>
                          {o.tipoArticolo}
                        </span>
                      </td>
                      <td className="td-secondary">{o.stagione}{o.tipoAttivita ? ` · ${o.tipoAttivita.substring(0,5)}.` : ''}</td>
                      <td className="td-mono">{o.quantita} {o.unitaMisura}</td>
                      <td className={`td-mono ${scad ? 'text-danger' : ''}`}>{fmt(o.dataConsegna)}</td>
                      <td><StatusPill stato={o.stato} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* DETAIL PANEL */}
      {selected && (
        <DettaglioPanel
          ordine={ordini.find(o => o.id === selected.id) || selected}
          onClose={() => setSelected(null)}
          onEdit={o => openEdit(o)}
        />
      )}

      {/* FORM MODAL */}
      {showForm && (
        <OrdineForm
          ordine={editOrdine}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
