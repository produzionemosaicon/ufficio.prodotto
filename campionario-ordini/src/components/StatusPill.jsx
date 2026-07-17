import React from 'react'

const CONFIG = {
  da_inviare: { label: 'Da inviare', cls: 'pill-pending' },
  inviato:    { label: 'Inviato',    cls: 'pill-sent'    },
  ricevuto:   { label: 'Ricevuto',   cls: 'pill-received'},
}

export default function StatusPill({ stato }) {
  const c = CONFIG[stato] || CONFIG.da_inviare
  return (
    <span className={`status-pill ${c.cls}`}>
      <span className="dot" />
      {c.label}
    </span>
  )
}
