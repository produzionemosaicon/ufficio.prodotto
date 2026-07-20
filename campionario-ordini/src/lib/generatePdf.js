import { jsPDF } from 'jspdf'

const ACCENT = [44, 110, 106]
const DARK   = [26, 25, 23]
const MUTED  = [138, 135, 127]
const LIGHT  = [247, 246, 243]
const BORDER = [216, 214, 206]
const WHITE  = [255, 255, 255]

export const TAGLIE = [
  '34','34.5','35','35.5','36','36.5','37','37.5','38','38.5','39','39.5',
  '40','40.5','41','41.5','42','42.5','43','43.5','44','44.5','45','45.5','46'
]

const TAGLIE_DISPLAY = {
  '34.5':'34½','35.5':'35½','36.5':'36½','37.5':'37½','38.5':'38½','39.5':'39½',
  '40.5':'40½','41.5':'41½','42.5':'42½','43.5':'43½','44.5':'44½','45.5':'45½'
}

function fmtDate(val) {
  if (!val) return '—'
  if (val?.toDate) return val.toDate().toLocaleDateString('it-IT')
  if (val instanceof Date) return val.toLocaleDateString('it-IT')
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split('-')
    return `${d}/${m}/${y}`
  }
  return String(val)
}

export function generateOrdinePDF(o) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, H = 297, M = 16
  const righe = o.righe || []

  // HEADER
  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, W, 24, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('MOSAICON SHOES SRL', M, 10)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text('Corso Novara, 171 — 27029 Vigevano PV', M, 14.5)
  doc.text('P.IVA 03177461203  ·  Tel. 0381-344311  ·  Ufficio Produzione', M, 18)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
  doc.text(o.numeroOrdine, W - M, 11, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text('del ' + fmtDate(o.createdAt), W - M, 16, { align: 'right' })
  doc.text('Pagina 1/1', W - M, 20, { align: 'right' })

  // TITOLO
  let y = 33
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
  doc.text('ORDINE FORNITORE', M, y)

  // META BOXES
  y += 12
  const boxH = 22, half = (W - 2 * M - 6) / 2
  doc.setFillColor(...LIGHT); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.roundedRect(M, y, half, boxH, 2, 2, 'FD')
  doc.setTextColor(...MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(6)
  doc.text('STAGIONE / TIPO ATTIVITÀ', M + 4, y + 5)
  doc.setTextColor(...DARK); doc.setFontSize(12)
  doc.text(o.stagione || '—', M + 4, y + 11.5)
  doc.setTextColor(...ACCENT); doc.setFontSize(9)
  doc.text((o.tipoAttivita || 'CAMPIONARIO').toUpperCase(), M + 4, y + 17)

  const rx = M + half + 6
  doc.setFillColor(...LIGHT)
  doc.roundedRect(rx, y, half, boxH, 2, 2, 'FD')
  doc.setTextColor(...MUTED); doc.setFontSize(6)
  doc.text('SPETT.LE / FORNITORE', rx + 4, y + 5)
  doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text(o.fornitore || '—', rx + 4, y + 11)

  // SPEDIZIONE
  y += boxH + 8
  doc.setFillColor(...WHITE); doc.setDrawColor(...BORDER)
  doc.roundedRect(M, y, W - 2 * M, 10, 1.5, 1.5, 'FD')
  const quarter = (W - 2 * M) / 4
  const spedFields = [
    ['SPEDIZIONE', o.spedizione || '—'],
    ['CONSEGNA', o.termini || '—'],
    ['PAGAMENTO', o.pagamento || '—'],
    ['CONSEGNA RICHIESTA', fmtDate(o.dataConsegna)],
  ]
  spedFields.forEach(([lab, val], i) => {
    const x = M + i * quarter + 3
    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5)
    doc.text(lab, x, y + 4)
    doc.setTextColor(...DARK); doc.setFontSize(7.5)
    doc.text(String(val), x, y + 8)
    if (i > 0) { doc.setDrawColor(...BORDER); doc.line(M + i * quarter, y + 1, M + i * quarter, y + 9) }
  })

  // RIGHE ARTICOLO
  y += 18
  righe.forEach((r, idx) => {
    if (y > 220) {
      doc.addPage()
      y = 20
    }

    const tipoLabel = (r.tipoArticolo || 'ARTICOLO').toUpperCase()
    doc.setTextColor(...ACCENT); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text('RIGA ' + (idx + 1) + ' — ' + tipoLabel, M, y)
    doc.setDrawColor(...ACCENT); doc.setLineWidth(0.6)
    doc.line(M, y + 2, W - M, y + 2)

    y += 8
    doc.setTextColor(...DARK); doc.setFontSize(10)
    doc.text(r.articolo || '—', M, y)
    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    let dy = y + 4.5
    if (r.colore)      { doc.text('Colore: ' + r.colore, M, dy); dy += 4 }
    if (r.lavorazione) { doc.text('Lavorazione: ' + r.lavorazione, M, dy); dy += 4 }
    if (r.modello)     { doc.text('Linea: ' + r.modello, M, dy); dy += 4 }
    y = dy + 3

    if ((r.tipoArticolo === 'Suola' || r.tipoArticolo === 'Tacco') && r.numerata) {
      const gridW = W - 2 * M
      const cellW = gridW / TAGLIE.length
      const rowH = 6
      doc.setFillColor(...LIGHT); doc.setDrawColor(...BORDER); doc.setLineWidth(0.25)
      doc.rect(M, y, gridW, rowH, 'FD')
      doc.setTextColor(...MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5)
      TAGLIE.forEach((t, i) => {
        const cx = M + i * cellW + cellW / 2
        doc.text(TAGLIE_DISPLAY[t] || t, cx, y + 4, { align: 'center' })
        if (i > 0) doc.line(M + i * cellW, y, M + i * cellW, y + rowH)
      })
      const y2 = y + rowH
      doc.setFillColor(...WHITE)
      doc.rect(M, y2, gridW, rowH, 'FD')
      doc.setFontSize(6.5)
      let totale = 0
      TAGLIE.forEach((t, i) => {
        const q = r.numerata[t]
        const cx = M + i * cellW + cellW / 2
        if (q) { totale += Number(q); doc.setTextColor(...DARK); doc.text(String(q), cx, y2 + 4, { align: 'center' }) }
        if (i > 0) { doc.setDrawColor(...BORDER); doc.line(M + i * cellW, y2, M + i * cellW, y2 + rowH) }
      })
      y = y2 + rowH + 6
      doc.setTextColor(...ACCENT); doc.setFontSize(8.5)
      doc.text('TOTALE PAIA: ' + totale, W - M, y, { align: 'right' })
      y += 6
    } else {
      doc.setFillColor(...LIGHT); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
      doc.roundedRect(M, y, 70, 12, 1.5, 1.5, 'FD')
      doc.setTextColor(...MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5)
      doc.text('QUANTITÀ', M + 4, y + 4.5)
      doc.setTextColor(...DARK); doc.setFontSize(11)
      doc.text((r.quantita || '—') + ' ' + (r.unitaMisura || ''), M + 4, y + 10)
      y += 18
    }

    y += 4
  })

  // NOTE
  if (y > 230) { doc.addPage(); y = 20 }
  y += 2
  doc.setTextColor(...ACCENT); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.text("NOTE / ISTRUZIONI — CONDIZIONI D'ACQUISTO", M, y)
  doc.setDrawColor(...ACCENT); doc.setLineWidth(0.6)
  doc.line(M, y + 2, W - M, y + 2)
  y += 6

  const noteLines = []
  if (o.note) {
    o.note.split('\n').forEach(l => noteLines.push({ t: l, style: 'user' }))
    noteLines.push({ t: '', style: 'normal' })
  }
  noteLines.push(
    { t: 'Spedizione tramite corriere GLS presso Vigevano Corso Novara 171', style: 'normal' },
    { t: '', style: 'normal' },
    { t: 'La Mosaicon Shoes SRL, opera in Esenzione Iva in quanto', style: 'normal' },
    { t: 'esportatore abituale DPR633/1972 Art.8 Comma 1 lett. a', style: 'normal' },
    { t: 'si invitano i fornitori a richiedere la dichiarazione di intento', style: 'normal' },
    { t: "INDICARE SEMPRE IL NOSTRO NUMERO D'ORDINE", style: 'bold' },
    { t: 'INDICARE SEMPRE I NOSTRI CODICI ARTICOLO', style: 'bold' },
    { t: 'Ufficio Produzione  Tel. 0381-344311', style: 'normal' },
    { t: '', style: 'normal' },
    { t: "Informativa di sintesi: ai sensi dell'art.13 D.Lgs.196/2003, informiamo che i Vs. dati sono inseriti in banche dati sia", style: 'small' },
    { t: 'elettroniche che cartacee, e sono trattati dagli incaricati solo per finalità amministrative e contabili. I dati potranno', style: 'small' },
    { t: 'essere comunicati a terzi per dar corso ai rapporti in essere o per obblighi di legge, ma non saranno diffusi.', style: 'small' },
    { t: 'Ai sensi degli artt. 7-8-9 del medesimo D.Lgs. 196/2003, informiamo che in ogni momento potrà essere richiesto', style: 'small' },
    { t: 'accesso a dati e sarà possibile opporsi a taluni loro utilizzi, rivolgendosi allo scrivente Titolare od al Responsabile.', style: 'small' },
  )

  const noteBoxH = noteLines.length * 3.8 + 8
  doc.setFillColor(...LIGHT); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.roundedRect(M, y, W - 2 * M, noteBoxH, 1.5, 1.5, 'FD')
  let ty = y + 6
  noteLines.forEach(({ t, style }) => {
    if (style === 'bold') { doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...DARK) }
    else if (style === 'small') { doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...MUTED) }
    else if (style === 'user') { doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...ACCENT) }
    else { doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...DARK) }
    if (t) doc.text(t, M + 4, ty)
    ty += 3.8
  })

  // FOOTER
  doc.setFillColor(...ACCENT)
  doc.rect(0, H - 9, W, 9, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  doc.text('Mosaicon Shoes SRL — Vigevano (PV)', M, H - 3.5)
  doc.text(o.numeroOrdine + ' · ' + fmtDate(o.createdAt), W - M, H - 3.5, { align: 'right' })

  doc.save(o.numeroOrdine.replace('/', '-') + '.pdf')
}
