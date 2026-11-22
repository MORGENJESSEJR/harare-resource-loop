import { navigation, type PageId } from './data.js'

export const quantityUnits = [
  { value: 'g', label: 'Grams', shortLabel: 'g' },
  { value: 'kg', label: 'Kilograms', shortLabel: 'kg' },
  { value: 'tonnes', label: 'Tonnes', shortLabel: 'tonnes' },
  { value: 'bags', label: 'Bags', shortLabel: 'bags' },
  { value: 'containers', label: 'Containers', shortLabel: 'containers' },
  { value: 'items', label: 'Items', shortLabel: 'items' },
] as const

export type QuantityUnit = (typeof quantityUnits)[number]['value']
export type Measurement = { value: number | null; unit: QuantityUnit | null; raw?: string }

const validUnits = new Set<string>(quantityUnits.map(unit => unit.value))

function normalizeUnit(value: string): QuantityUnit | null {
  const unit = value.toLowerCase().replace(/\.$/, '')
  if (unit === 'g' || unit.startsWith('gram')) return 'g'
  if (unit === 'kg' || unit.startsWith('kilogram')) return 'kg'
  if (unit === 't' || unit.startsWith('tonne') || unit.startsWith('ton')) return 'tonnes'
  if (unit.startsWith('bag')) return 'bags'
  if (unit.startsWith('container')) return 'containers'
  if (unit.startsWith('item') || unit.startsWith('piece')) return 'items'
  return validUnits.has(unit) ? unit as QuantityUnit : null
}

/** Parse a quantity only when it includes a supported unit. */
export function parseQuantityInput(input: string): Measurement | null {
  const match = /^\s*(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)\s*$/.exec(input)
  if (!match) return null
  const value = Number(match[1].replace(',', '.'))
  const unit = normalizeUnit(match[2])
  if (!Number.isFinite(value) || value <= 0 || !unit) return null
  return { value, unit }
}

/** Preserve older text entries, but leave missing or unrecognised units unweighted. */
export function normalizeMeasurement(value: unknown, unit: unknown, legacy: unknown = ''): Measurement {
  const raw = typeof legacy === 'string' ? legacy.trim() : ''
  const numericValue = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN
  const normalizedUnit = typeof unit === 'string' ? normalizeUnit(unit) : null
  if (Number.isFinite(numericValue) && numericValue >= 0 && normalizedUnit) {
    return { value: numericValue, unit: normalizedUnit, raw: raw || undefined }
  }

  const parsed = parseQuantityInput(raw)
  if (parsed) return { ...parsed, raw }
  return { value: null, unit: null, raw: raw || undefined }
}

export function measurementToKilograms(measurement: Measurement): number | null {
  const { value, unit } = measurement
  if (value === null || !Number.isFinite(value) || value < 0 || !unit) return null
  if (unit === 'g') return value / 1000
  if (unit === 'kg') return value
  if (unit === 'tonnes') return value * 1000
  return null
}

export function totalKilograms(measurements: readonly Measurement[]): number {
  const total = measurements.reduce((sum, item) => sum + (measurementToKilograms(item) ?? 0), 0)
  return Math.round(total * 1000) / 1000
}

export function formatMeasurement(measurement: Measurement): string {
  if (measurement.value !== null && measurement.unit) {
    const unit = measurement.unit === 'g' ? 'g' : measurement.unit === 'kg' ? 'kg' : measurement.unit
    return `${measurement.value} ${unit}`
  }
  return measurement.raw ?? ''
}

export function localDateISO(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function clearDemoStorage(storage: Pick<Storage, 'length' | 'key' | 'removeItem'>): string[] {
  const keysToRemove: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith('hrl:')) keysToRemove.push(key)
  }
  keysToRemove.forEach(key => storage.removeItem(key))
  return keysToRemove
}

export function eventHasOccurred(eventDate: string, today = localDateISO()): boolean {
  // With date-only event data, the event may still be in progress today. Open attendance the next day.
  return /^\d{4}-\d{2}-\d{2}$/.test(eventDate) && eventDate < today
}

export type HashRoute = { page: PageId; campaignId: string | null; issue: string | null }

export function campaignShareHash(id: string): string {
  return `#community/campaign/${encodeURIComponent(id)}`
}

export function parseHashRoute(hash: string, campaignIds: readonly string[]): HashRoute {
  const value = hash.replace(/^#/, '')
  const question = value.indexOf('?')
  const path = (question < 0 ? value : value.slice(0, question)).replace(/^\/+|\/+$/g, '')
  const query = question < 0 ? '' : value.slice(question + 1)
  const parts = path.split('/').filter(Boolean)
  const parameters = new URLSearchParams(query)
  const campaignPath = parts[0] === 'community' && parts[1] === 'campaign'
  const legacyCampaignQuery = parts[0] === 'community' && parameters.has('campaign')

  if (campaignPath || legacyCampaignQuery) {
    let campaignId = campaignPath ? parts[2] : parameters.get('campaign') ?? ''
    if (campaignPath && parts.length !== 3) {
      return { page: 'community', campaignId: null, issue: campaignId ? 'That campaign link is not valid.' : 'That campaign link is missing its campaign ID.' }
    }
    if (!campaignId) return { page: 'community', campaignId: null, issue: 'That campaign link is missing its campaign ID.' }
    try {
      campaignId = decodeURIComponent(campaignId)
    } catch {
      return { page: 'community', campaignId: null, issue: 'That campaign link is not valid.' }
    }
    if (!campaignIds.includes(campaignId)) {
      return { page: 'community', campaignId: null, issue: 'This campaign is not available in the current browser demo.' }
    }
    return { page: 'community', campaignId, issue: null }
  }

  const page = navigation.find(item => item.id === parts[0])?.id ?? 'overview'
  return { page, campaignId: null, issue: null }
}

export type ReportEntry = {
  name: string
  date: string
  organisation: string
  role: string
  hours?: number
  skills: string[]
  status: string
}

export function buildContributionReportHtml(displayName: string, entries: readonly ReportEntry[], generatedDate: string, shareable = false): string {
  const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  const title = shareable ? 'Shareable community portfolio' : 'Private community contribution report'
  const rows = entries.map(entry => `<tr><td>${escapeHtml(entry.name)}</td><td>${escapeHtml(entry.date)}</td><td>${escapeHtml(entry.organisation)}</td><td>${escapeHtml(entry.role)}</td><td>${entry.hours == null ? '—' : `${escapeHtml(String(entry.hours))} h`}</td><td>${escapeHtml(entry.skills.join(', ') || '—')}</td><td>${escapeHtml(entry.status)}</td></tr>`).join('') || '<tr><td colspan="7">No activities are included in this report.</td></tr>'
  const notice = 'This report contains participant-entered records and simulated reviews. Self-reported entries are not independently verified. It is not an employment guarantee, official qualification, certificate or organisational endorsement.'
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(displayName)} — ${title}</title><style>
    :root{color-scheme:light;font-family:Arial,Helvetica,sans-serif;color:#20352b}*{box-sizing:border-box}body{max-width:1000px;margin:0 auto;padding:32px 24px;font-size:15px;line-height:1.5}header{border-bottom:2px solid #2d6148;padding-bottom:16px;margin-bottom:20px}h1{font-size:28px;line-height:1.2;margin:0 0 6px}h2{font-size:18px;margin:22px 0 10px}.meta{color:#47594e}.notice{border-left:4px solid #b67a27;background:#fbf3e3;padding:12px 14px;margin:20px 0}table{border-collapse:collapse;width:100%;margin-top:18px}th,td{text-align:left;border:1px solid #d4ddd4;padding:9px;vertical-align:top}th{background:#eef3eb}footer{margin-top:28px;padding-top:12px;border-top:1px solid #d4ddd4;color:#47594e;font-size:13px}.print-action{position:fixed;right:24px;top:18px;background:#245c48;color:white;border:0;border-radius:6px;padding:12px 16px;font-size:15px;cursor:pointer}@page{size:A4;margin:16mm}@media print{body{max-width:none;padding:0}.print-action{display:none}tr{break-inside:avoid}header,table{break-inside:avoid}}
    </style></head><body><button class="print-action" type="button" onclick="window.print()">Print / Save as PDF</button><header><h1>${escapeHtml(displayName)}</h1><div class="meta">${title} · Generated ${escapeHtml(generatedDate)}</div></header><div class="notice">${notice}</div><h2>Participation activities</h2><table><thead><tr><th>Activity</th><th>Date</th><th>Organisation</th><th>Role</th><th>Hours</th><th>Skills</th><th>Verification status</th></tr></thead><tbody>${rows}</tbody></table><footer>Harare Resource Loop · local demonstration report. Verified and self-reported status labels reflect this browser prototype only.</footer></body></html>`
}
