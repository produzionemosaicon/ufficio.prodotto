import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  List, Clock, Send, CheckCircle, Package, Layers, Box,
  Plus, Search, ChevronUp, ChevronDown, AlertTriangle, Check
} from 'lucide-react'
import { subscribeOrdini } from './lib/ordini'
import StatusPill from './components/StatusPill'
import DettaglioPanel from './components/DettaglioPanel'
import OrdineForm, { ATTIVITA } from './components/OrdineForm'
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
  Tacco:        { label: 'Tacchi',       icon: Package },
  Forme:        { label: 'Forme',        icon: Box },
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

/* ── MULTISELECT ATTIVITÀ ──────────────────────────────── */
function MultiSelectAttivita({ selezionate, onChange, conteggi }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current
