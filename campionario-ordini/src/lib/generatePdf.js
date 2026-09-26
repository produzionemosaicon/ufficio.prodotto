import { jsPDF } from 'jspdf'
import { drawLogo } from './logo'

const ACCENT = [44, 110, 106]
const DARK   = [26, 25, 23]
const MUTED  = [138, 135, 127]
const LIGHT  = [247, 246, 243]
const BORDER = [216, 214, 206]
const WHITE  = [255, 255, 255]
const ACCLT  = [234, 243, 242]

export const TAGLIE = [
  '34','34.5','35','35.5','36','36.5','37','37.5','38','38.5','39','39.5',
  '40','40.5','41','41.5','42','42.5','43','43.5','44','44.5','45','45.5','46'
]

export const NUMERATA_TIPI = ['Suola', 'Tacco', 'Forme']

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
  const totW = W - 2 * M
  const righe = o.righe || []

  // HEADER con logo vettoriale
  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, W, 24, 'F')
  drawLogo(doc, M, 6, 52)
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text('Corso Novara, 171 — 27029 Vigevano PV', M, 16.5)
  doc.text('P.IVA 03177461203  ·  Tel. 0381-344311', M, 20)
  doc.setFontSize(8)
  doc.text('del ' + fmtDate(o.createdAt), W - M, 13, { align: 'right' })
  doc.text('Pagina 1/1', W - M, 18, { align: 'right' })

  let y = 33
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
  doc.text('ORDINE FORNITORE', M, y)

  // META: stagione | fornitore | numero ordine
  y += 8
  const boxH = 24, gap = 5
  const wSt = (totW - 2 * gap) * 0.26
  const wFo = (totW - 2 * gap) * 0.40
  const wOr = (totW - 2 * gap) * 0.34

  doc.setFillColor(...LIGHT); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.roundedRect(M, y, wSt, boxH, 2, 2, 'FD')
  doc.setTextColor(...MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(6)
  doc.text('STAGIONE / ATTIVITÀ', M + 4, y + 5)
  doc.setTextColor(...DARK); doc.setFontSize(11)
  doc.text(o.stagione || '—', M + 4, y + 12)
  doc.setTextColor(...ACCENT); doc.setFontSize(8.5)
  doc.text((o.tipoAttivita || 'CAMPIONARIO').toUpperCase(), M + 4, y + 18)

  const x2 = M + wSt + gap
  doc.setFillColor(...LIGHT); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.roundedRect(x2, y, wFo, boxH, 2, 2, 'FD')
  doc.setTextColor(...MUTED); doc.setFontSize(6)
  doc.text('SPETT.LE / FORNITORE', x2 + 4, y + 5)
  doc.setTextColor(...DARK); doc.setFontSize(11)
  doc.text(o.fornitore || '—', x2 + 4, y + 13)

  const x3 = x2 + wFo + gap
  doc.setFillColor(...ACCLT); doc.setDrawColor(...ACCENT); doc.setLineWidth(1)
  doc.roundedRect(x3, y, wOr, boxH, 2, 2, 'FD')
  doc.setTextColor(...ACCENT); doc.setFontSize(6.5)
  doc.text('ORDINE DA INDICARE IN DDT', x3 + wOr / 2, y + 6, { align: 'center' })
  doc.setTextColor(...DARK); doc.setFontSize(22)
  doc.text(o.numeroOrdine, x3 + wOr / 2, y + 17, { align: 'center' })

  // CONSEGNA RICHIESTA + REFERENTE
  y += boxH + 7
  const wCons = totW * 0.42
  doc.setFillColor(...WHITE); doc.setDrawColor(...DARK); doc.setLineWidth(0.8)
  doc.roundedRect(M, y, wCons, 11, 1.5, 1.5, 'FD')
  doc.setTextColor(...MUTED); doc.setFontSize(6)
  doc.text('DATA CONSEGNA RICHIESTA', M + 5, y + 4.5)
  doc.setTextColor(...DARK); doc.setFontSize(13)
  doc.text(fmtDate(o.dataConsegna), M + 5, y + 9.5)

  const xRef = M + wCons + 5
  const wRef = totW - wCons - 5
  doc.setFillColor(...LIGHT); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.roundedRect(xRef, y, wRef, 11, 1.5, 1.5, 'FD')
  doc.setTextColor(...MUTED); doc.setFontSize(6)
  doc.text('REFERENTE ORDINE', xRef + 5, y + 4.5)
  doc.setTextColor(...DARK); doc.setFontSize(11)
  doc.text(o.ordinatoDa || '—', xRef + 5, y + 9.5)

  // RIGHE ARTICOLO
  y += 18
  righe.forEach((r, idx) => {
    if (y > 210) { doc.addPage(); y = 20 }

    doc.setTextColor(...ACCENT); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text('RIGA ' + (idx + 1) + ' — ' + (r.tipoArticolo || 'ARTICOLO').toUpperCase(), M, y)
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

    if (NUMERATA_TIPI.includes(r.tipoArticolo) && r.numerata) {
      const cellW = totW / TAGLIE.length
      const rowH = 6
      doc.setFillColor(...LIGHT); doc.setDrawColor(...BORDER); doc.setLineWidth(0.25)
      doc.rect(M, y, totW, rowH, 'FD')
      doc.setTextColor(...MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5)
      TAGLIE.forEach((t, i) => {
        doc.text(TAGLIE_DISPLAY[t] || t, M + i * cellW + cellW / 2, y + 4, { align: 'center' })
        if (i > 0) doc.line(M + i * cellW, y, M + i * cellW, y + rowH)
      })
      const y2 = y + rowH
      doc.setFillColor(...WHITE)
      doc.rect(M, y2, totW, rowH, 'FD')
      doc.setFontSize(6.5)
      let totale = 0
      TAGLIE.forEach((t, i) => {
        const q = r.numerata[t]
        if (q) { totale += Number(q); doc.setTextColor(...DARK); doc.text(String(q), M + i * cellW + cellW / 2, y2 + 4, { align: 'center' }) }
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

  // SPEDIZIONE E PAGAMENTO
  if (y > 225) { doc.addPage(); y = 20 }
  y += 3
  doc.setTextColor(...ACCENT); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.text('SPEDIZIONE E PAGAMENTO', M, y)
  doc.setDrawColor(...ACCENT); doc.setLineWidth(0.6)
  doc.line(M, y + 2, W - M, y + 2)
  y += 6
  doc.setFillColor(...WHITE); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.roundedRect(M, y, totW, 10, 1.5, 1.5, 'FD')
  const third = totW / 3
  const sped = [
    ['SPEDIZIONE', o.spedizione || '—'],
    ['TERMINI CONSEGNA', o.termini || '—'],
    ['PAGAMENTO', o.pagamento || '—'],
  ]
  sped.forEach(([lab, val], i) => {
    const x = M + i * third + 3
    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5)
    doc.text(lab, x, y + 4)
    doc.setTextColor(...DARK); doc.setFontSize(7.5)
    doc.text(String(val), x, y + 8)
    if (i > 0) { doc.setDrawColor(...BORDER); doc.line(M + i * third, y + 1, M + i * third, y + 9) }
  })

  // NOTE
  y += 17
  if (y > 235) { doc.addPage(); y = 20 }
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
    { t: 'Spedizione tramite corriere TNT o FedEx con account Mosaicon Shoes,', style: 'normal' },
    { t: 'per info contattare il sig. Luca Orlandi', style: 'normal' },
    { t: '', style: 'normal' },
    { t: 'La Mosaicon Shoes SRL, opera in Esenzione Iva in quanto', style: 'normal' },
    { t: 'esportatore abituale DPR633/1972 Art.8 Comma 1 lett. a', style: 'normal' },
    { t: 'si invitano i fornitori a richiedere la dichiarazione di intento', style: 'normal' },
    { t: "INDICARE SEMPRE IL NOSTRO NUMERO D'ORDINE", style: 'bold' },
    { t: 'INDICARE SEMPRE I NOSTRI CODICI ARTICOLO', style: 'bold' },
    { t: '', style: 'normal' },
    { t: "Informativa di sintesi: ai sensi dell'art.13 D.Lgs.196/2003, informiamo che i Vs. dati sono inseriti in banche dati sia", style: 'small' },
    { t: 'elettroniche che cartacee, e sono trattati dagli incaricati solo per finalità amministrative e contabili. I dati potranno', style: 'small' },
    { t: 'essere comunicati a terzi per dar corso ai rapporti in essere o per obblighi di legge, ma non saranno diffusi.', style: 'small' },
    { t: 'Ai sensi degli artt. 7-8-9 del medesimo D.Lgs. 196/2003, in ogni momento potrà essere richiesto accesso ai dati.', style: 'small' },
  )

  const noteBoxH = noteLines.length * 3.8 + 8
  doc.setFillColor(...LIGHT); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.roundedRect(M, y, totW, noteBoxH, 1.5, 1.5, 'FD')
  let ty = y + 6
  noteLines.forEach(({ t, style }) => {
    if (style === 'bold') { doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...DARK) }
    else if (style === 'small') { doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...MUTED) }
    else if (style === 'user') { doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...ACCENT) }
    else { doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...DARK) }
    if (t) doc.text(t, M + 4, ty)
    ty += 3.8
  })

  doc.setFillColor(...ACCENT)
  doc.rect(0, H - 9, W, 9, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  doc.text('Mosaicon Shoes SRL — Vigevano (PV)', M, H - 3.5)
  doc.text(o.numeroOrdine + ' · ' + fmtDate(o.createdAt), W - M, H - 3.5, { align: 'right' })

  doc.save(o.numeroOrdine.replace('/', '-') + '.pdf')
}
