import { ChangeEvent, Dispatch, FormEvent, ReactNode, SetStateAction, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronDown,
  FileText, Filter, HeartHandshake, Info, Leaf, MessageCircle,
  Package, Plus, Recycle, Search, ShieldCheck, Smartphone, Sprout, Truck, Upload, X,
} from 'lucide-react'
import {
  APP_NAME, binsSeed, collectionPoints, eventsSeed, initialBooks,
  initialListings, initialRequests, listingMaterials, materials, navigation, organisations,
  partnerGroups, research, suburbs,
  type PageId,
} from './data'
import { localReuseProvider } from './reuseProvider'
import { DesktopNavigation, MobileNavigation } from './components/Navigation'
import { MaterialCatalog } from './components/MaterialCatalog'
import { CircularLoop } from './components/CircularLoop'
import { CollectionProgress, Empty, ImpactCard, PageHeader, SectionTitle, Source, StatusTag } from './components/ui'
import {
  buildContributionReportHtml, campaignShareHash, clearDemoStorage, eventHasOccurred, formatMeasurement,
  localDateISO, measurementToKilograms, normalizeMeasurement, parseHashRoute,
  parseQuantityInput, quantityUnits, totalKilograms, type Measurement, type QuantityUnit,
} from './domain'

type Role = 'Resident' | 'Collector' | 'Recycler/Buyer' | 'Operator'
type Activity = {
  id: string; name: string; date: string; location: string; organisation: string; role: string;
  hours?: number; skills: string[]; status: 'Self-reported' | 'Organiser-confirmed' | 'Organisation-verified';
  verifiedBy?: string; public: boolean; type: 'Volunteer' | 'Donation' | 'Campaign' | 'Collection' | 'Book exchange'; description: string
}
type Request = { id: string; suburb: string; materials: string[]; date: string; note: string; status: string; quantity: string; quantityValue?: number | null; quantityUnit?: QuantityUnit | null; quantityDisplay?: string }
type Listing = { id: string; material: string; quantity: string; location: string; condition: string; cleanliness: string; sorting: string; availability: string; price: string; preference: string; seller: string; description: string }
type Book = { id: string; title: string; grade: string; subject: string; edition: string; condition: string; offer: string; location: string; owner: string }
type Campaign = { id: string; name: string; organisation: string; objective: string; categories: string[]; start: string; end: string; organiser: string; target: number; progress: number; members: number; arrangement: string; status: 'Active' | 'Completed' }
type Event = (typeof eventsSeed)[number]

const today = localDateISO()
const initialCampaigns: Campaign[] = [
  { id: 'CAM-21', name: 'Highfield school supplies collection', organisation: "Harare Children's Home", objective: 'Coordinate a stationery drive and deliver only after the organisation confirms its current needs.', categories: ['School stationery'], start: '2026-11-18', end: '2026-12-12', organiser: 'Neighbourhood demonstration group', target: 20, progress: 8, members: 5, arrangement: 'Delivery arranged directly with the organisation', status: 'Active' },
]
const initialActivities: Activity[] = []

function normalizeRequestRecords(input: unknown): Request[] {
  const values = Array.isArray(input) ? input : initialRequests
  return values.filter((record): record is Record<string, unknown> => Boolean(record) && typeof record === 'object').map((record, index) => {
    const legacyQuantity = typeof record.quantity === 'string' ? record.quantity : typeof record.quantityDisplay === 'string' ? record.quantityDisplay : ''
    const measurement = normalizeMeasurement(record.quantityValue, record.quantityUnit, legacyQuantity)
    const quantityDisplay = formatMeasurement(measurement)
    return {
      ...record,
      id: typeof record.id === 'string' && record.id ? record.id : `HRL-LEGACY-${index + 1}`,
      suburb: typeof record.suburb === 'string' ? record.suburb : 'Area not recorded',
      materials: Array.isArray(record.materials) ? record.materials.filter((material): material is string => typeof material === 'string') : [],
      date: typeof record.date === 'string' ? record.date : today,
      note: typeof record.note === 'string' ? record.note : 'No access instructions supplied',
      status: typeof record.status === 'string' ? record.status : 'Awaiting collector',
      quantity: quantityDisplay || legacyQuantity,
      quantityValue: measurement.value,
      quantityUnit: measurement.unit,
      quantityDisplay,
    } as Request
  })
}

function useStored<T>(key: string, seed: T, normalize?: (value: unknown) => T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`hrl:${key}`)
      if (raw) { const parsed = JSON.parse(raw) as unknown; return normalize ? normalize(parsed) : parsed as T }
      return normalize ? normalize(seed) : seed
    } catch { return normalize ? normalize(seed) : seed }
  })
  useEffect(() => { try { localStorage.setItem(`hrl:${key}`, JSON.stringify(value)) } catch { /* storage may be unavailable */ } }, [key, value])
  return [value, setValue]
}

function App() {
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [role, setRole] = useStored<Role>('role', 'Resident')
  const [requests, setRequests] = useStored<Request[]>('requests', initialRequests, normalizeRequestRecords)
  const [listings, setListings] = useStored<Listing[]>('listings', initialListings)
  const [books, setBooks] = useStored<Book[]>('books', initialBooks)
  const [campaigns, setCampaigns] = useStored<Campaign[]>('campaigns', initialCampaigns)
  const initialRoute = parseHashRoute(location.hash, campaigns.map(campaign => campaign.id))
  const [page, setPage] = useState<PageId>(initialRoute.page)
  const [targetCampaignId, setTargetCampaignId] = useState<string | null>(initialRoute.campaignId)
  const [activities, setActivities] = useStored<Activity[]>('activities', initialActivities)
  const [eventRegistrations, setEventRegistrations] = useStored<string[]>('event-registrations', [])
  const [notice, setNotice] = useState('')
  const [displayName, setDisplayName] = useStored('display-name', 'Community member')
  const [interested, setInterested] = useStored<string[]>('listing-interest', [])
  const [joinedCampaigns, setJoinedCampaigns] = useStored<string[]>('campaign-membership', [])
  const [publicProfile, setPublicProfile] = useStored('profile-public', false)

  useEffect(() => {
    const isEditable = (target: EventTarget | null) => target instanceof HTMLElement && target.matches('input:not([type=checkbox]):not([type=radio]), textarea, select')
    const onFocusIn = (event: FocusEvent) => { if (isEditable(event.target)) setKeyboardOpen(true) }
    const onFocusOut = () => window.setTimeout(() => setKeyboardOpen(isEditable(document.activeElement)), 0)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => { document.removeEventListener('focusin', onFocusIn); document.removeEventListener('focusout', onFocusOut) }
  }, [])

  useEffect(() => {
    const onHash = () => {
      const route = parseHashRoute(location.hash, campaigns.map(campaign => campaign.id))
      setPage(route.page)
      setTargetCampaignId(route.campaignId)
      if (route.issue) setNotice(route.issue)
    }
    window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash)
  }, [campaigns])
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 4200); return () => window.clearTimeout(timer) }, [notice])
  const navigate = (id: PageId) => { setPage(id); setTargetCampaignId(null); location.hash = id; window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const addActivity = (activity: Omit<Activity, 'id' | 'status' | 'public'>) => {
    setActivities(current => [{ ...activity, id: `ACT-${Date.now()}`, status: 'Self-reported', public: false }, ...current])
  }
  const updateRequest = (id: string, status: string, quantity?: Measurement) => setRequests(current => current.map(r => r.id === id ? { ...r, status, ...(quantity ? { quantityValue: quantity.value, quantityUnit: quantity.unit, quantity: formatMeasurement(quantity), quantityDisplay: formatMeasurement(quantity) } : {}) } : r))

  const resetDemoData = () => {
    if (!window.confirm('Reset Harare Resource Loop demo data in this browser? Only this app’s hrl: records will be removed.')) return
    try {
      clearDemoStorage(localStorage)
      location.hash = '#overview'
      location.reload()
    } catch {
      setNotice('This browser did not allow the demo data to reset.')
    }
  }

  return <div className={`app-shell ${keyboardOpen ? 'keyboard-open' : ''}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <DesktopNavigation page={page} onNavigate={navigate} hasOpenRequests={requests.some(r => r.status === 'Awaiting collector')} />
    <main id="main-content" className="main-area" tabIndex={-1}>
      <header className="topbar">
        <div className="breadcrumb"><span>Harare Resource Loop</span><span className="crumb-separator">/</span><strong>{navigation.find(n => n.id === page)?.label}</strong></div>
        <div className="top-actions"><span className="demo-pill"><span /> Demonstration mode</span><label className="role-switch">View as <select value={role} onChange={e => setRole(e.target.value as Role)} aria-label="Switch demonstration role"><option>Resident</option><option>Collector</option><option>Recycler/Buyer</option><option>Operator</option></select></label></div>
      </header>
      <aside className="demo-notice" aria-label="Prototype notice"><Info size={18} aria-hidden="true" /><p><strong>Prototype:</strong> records stay in this browser and are not synced. Bin and USSD data are simulated; listed partners are prospective unless confirmed.</p><button type="button" className="button button-secondary reset-demo" onClick={resetDemoData}>Reset demonstration data</button></aside>
      <div className="content-wrap">
        {page === 'overview' && <Overview requests={requests} listings={listings} activities={activities} campaigns={campaigns} navigate={navigate} />}
        {page === 'collection' && <Collection role={role} requests={requests} setRequests={setRequests} updateRequest={updateRequest} notice={setNotice} />}
        {page === 'marketplace' && <Marketplace role={role} listings={listings} setListings={setListings} interested={interested} setInterested={setInterested} notice={setNotice} />}
        {page === 'reuse' && <ReuseStudio notice={setNotice} />}
        {page === 'learn' && <Learn />}
        {page === 'books' && <Books books={books} setBooks={setBooks} addActivity={addActivity} notice={setNotice} />}
        {page === 'community' && <Community role={role} targetCampaignId={targetCampaignId} activities={activities} setActivities={setActivities} campaigns={campaigns} setCampaigns={setCampaigns} registrations={eventRegistrations} setRegistrations={setEventRegistrations} joined={joinedCampaigns} setJoined={setJoinedCampaigns} displayName={displayName} setDisplayName={setDisplayName} publicProfile={publicProfile} setPublicProfile={setPublicProfile} addActivity={addActivity} notice={setNotice} />}
        {page === 'points' && <Points />}
        {page === 'operations' && <Operations />}
        {page === 'partners' && <Partners />}
        {page === 'impact' && <Impact requests={requests} listings={listings} books={books} activities={activities} campaigns={campaigns} />}
      </div>
      <footer className="app-footer"><span>{APP_NAME} · local-first demonstration</span><span>Sources and data classifications appear alongside each figure.</span></footer>
    </main>
    <MobileNavigation page={page} onNavigate={navigate} />
    {notice && <div className="toast" role="status"><Check size={17} />{notice}</div>}
  </div>
}

function Overview({ requests, listings, activities, campaigns, navigate }: { requests: Request[]; listings: Listing[]; activities: Activity[]; campaigns: Campaign[]; navigate: (id: PageId) => void }) {
  const openRequests = requests.filter(r => !['Completed', 'Cancelled'].includes(r.status)).length
  const activeCampaigns = campaigns.filter(c => c.status === 'Active').length
  const recent = [
    ...activities.map(a => ({ id: a.id, name: a.name, date: a.date, location: a.location, organisation: a.organisation, status: a.status, type: a.type })),
    ...requests.map(r => ({ id: r.id, name: `Collection request ${r.id}`, date: r.date, location: r.suburb, organisation: 'Collection workflow', status: r.status, type: 'Collection' })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  return <>
    <PageHeader eyebrow="City resource system" title="Good morning, Harare" description="See the local coordination picture, then take the next useful action." action={<button className="button button-primary" onClick={() => navigate('collection')}><Plus size={16} /> Request a collection</button>} />
    <section className="baseline-panel">
      <div className="baseline-intro"><span className="overline">City baseline · 2021</span><h2>Most municipal waste still sits outside controlled management.</h2><p>Use these published measurements as planning context. They are historical research data, not live city telemetry.</p><button className="text-button" onClick={() => navigate('impact')}>Explore impact & economics <ArrowRight size={15} /></button></div>
      <div className="baseline-stats">{research.slice(0, 4).map(item => <div className="baseline-stat" key={item.label}><strong>{item.value}</strong><span>{item.unit}</span><small>{item.label}</small></div>)}</div>
      <Source href={research[0].href} tag="Official research · 2021">{research[0].source}</Source>
    </section>
    <section className="loop-panel"><div className="loop-heading"><span className="overline">The circular economy</span><h2>Keep useful materials moving</h2><p>A coordination model for Harare. This prototype does not operate the handoffs.</p></div><CircularLoop /></section>
    <div className="section-title home-section"><div><h2>Coordination today</h2><p>Live within this browser’s saved demonstration records.</p></div><span className="small-label"><span className="sim-dot" /> Demo records</span></div>
    <div className="metric-grid">
      <Metric label="Collection requests" value={String(openRequests)} context={`${requests.length} total requests`} icon={<Truck />} action={() => navigate('collection')} />
      <Metric label="Material listings" value={String(listings.length)} context="Marketplace offers" icon={<Recycle />} action={() => navigate('marketplace')} />
      <Metric label="Collection areas" value={String(collectionPoints.length)} context="Illustrative areas to validate" icon={<Info />} action={() => navigate('points')} />
      <Metric label="Community activities" value={String(activities.length)} context={`${activities.filter(a => a.status !== 'Self-reported').length} with simulated confirmation`} icon={<HeartHandshake />} action={() => navigate('community')} />
      <Metric label="Active group drives" value={String(activeCampaigns)} context="Self-organised campaigns" icon={<Package />} action={() => navigate('community')} />
    </div>
    <div className="dashboard-columns">
      <section className="panel activity-panel"><SectionTitle title="Recent activity" detail="From local demo records" action={<button className="text-button" onClick={() => navigate('impact')}>View impact <ArrowRight size={14} /></button>} />
        <div className="activity-list">{recent.length ? recent.map(a => <div className="activity-row" key={a.id}><div className={`activity-icon ${a.type.toLowerCase()}`}>{a.type === 'Volunteer' ? <Sprout size={16} /> : a.type === 'Donation' ? <HeartHandshake size={16} /> : a.type === 'Collection' ? <Truck size={16} /> : <Recycle size={16} />}</div><div className="activity-copy"><strong>{a.name}</strong><span>{a.location} · {a.organisation}</span></div><div className="activity-meta"><StatusTag status={a.status} /><time>{a.date}</time></div></div>) : <Empty>New collection, marketplace, book, and community records will appear here as they are created.</Empty>}</div>
      </section>
      <section className="panel quick-panel"><SectionTitle title="Next actions" detail="Useful starting points" />
        <button className="action-row" onClick={() => navigate('marketplace')}><span className="action-icon"><Recycle size={17} /></span><span><strong>Find a material buyer</strong><small>{listings.length} offers currently listed</small></span><ArrowRight size={16} /></button>
        <button className="action-row" onClick={() => navigate('community')}><span className="action-icon"><HeartHandshake size={17} /></span><span><strong>Join a community activity</strong><small>Upcoming events in Harare</small></span><ArrowRight size={16} /></button>
        <button className="action-row" onClick={() => navigate('operations')}><span className="action-icon"><Smartphone size={17} /></span><span><strong>Try the basic-phone flow</strong><small>USSD collection simulator</small></span><ArrowRight size={16} /></button>
      </section>
    </div>
    <section className="event-strip"><div><span className="event-date">29<span>NOV</span></span><div><span className="overline">Upcoming · Demonstration activity</span><strong>Mbare market clean-up and sorting day</strong><small>Community demonstration group · venue details coordinated after registration</small></div></div><button className="button button-secondary" onClick={() => navigate('community')}>View community calendar <ArrowRight size={15} /></button></section>
    <div className="footnote"><Info size={14} /><span>Two per-capita figures are kept in separate periods: 0.56 kg/person/day in the 2021 UN-Habitat assessment and 0.54 kg/person/day estimated for 2024 in the City of Harare Master Plan (published 2025). <Source href="https://www.hararecity.co.zw/resources/download/388" tag="City estimate · 2024">City of Harare Master Plan</Source></span></div>
  </>
}
function Metric({ label, value, context, icon, action }: { label: string; value: string; context: string; icon: ReactNode; action: () => void }) {
  return <button className="metric-card" onClick={action}><span className="metric-top"><span>{label}</span><i>{icon}</i></span><strong>{value}</strong><small>{context}</small></button>
}
function Collection({ role, requests, setRequests, updateRequest, notice }: { role: Role; requests: Request[]; setRequests: Dispatch<SetStateAction<Request[]>>; updateRequest: (id: string, status: string, quantity?: Measurement) => void; notice: (s: string) => void }) {
  const [form, setForm] = useState({ suburb: 'Mbare', date: '', note: '' })
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(['Plastics'])
  const [quantities, setQuantities] = useState<Record<string, { value: string; unit: QuantityUnit }>>({})
  const collector = role === 'Collector'
  const submit = (e: FormEvent) => { e.preventDefault(); if (!selectedMaterials.length) { notice('Choose at least one material stream.'); return }
    const request: Request = { id: `HRL-${Math.floor(1000 + Math.random() * 8999)}`, suburb: form.suburb, materials: selectedMaterials, date: form.date || today, note: form.note || 'No access instructions supplied', status: 'Awaiting collector', quantity: '', quantityValue: null, quantityUnit: null }
    setRequests(current => [request, ...current]); setForm(v => ({ ...v, note: '' })); setSelectedMaterials(['Plastics']); notice(`Collection request ${request.id} saved on this device.`)
  }
  return <>
    <PageHeader eyebrow="Collection network" title={collector ? 'Collector task board' : 'Coordinate a collection'} description={collector ? 'Accept a nearby request, record the material, and close the loop.' : 'Separate a material stream and request a pickup. A local collector can accept the task in this demo.'} action={<span className="outline-pill">{collector ? 'Collector view' : `${role} view`}</span>} />
    <div className="collection-layout">
      {!collector && <section className="panel form-panel"><SectionTitle title="New collection request" detail="One request per location and preferred day." />
        <form onSubmit={submit} className="stack-form"><label>Suburb or collection area<select value={form.suburb} onChange={e => setForm({ ...form, suburb: e.target.value })}>{suburbs.map(s => <option key={s}>{s}</option>)}</select></label>
          <fieldset><legend>Materials to collect</legend><p className="field-hint">Keep different material streams separate where possible.</p><div className="check-grid">{materials.map(item => <label className="check-choice" key={item}><input type="checkbox" checked={selectedMaterials.includes(item)} onChange={e => setSelectedMaterials(v => e.target.checked ? [...v, item] : v.filter(x => x !== item))} /><span>{item}</span></label>)}</div></fieldset>
          <div className="form-two"><label>Preferred date<input type="date" min={today} value={form.date} onInput={e => { const date = e.currentTarget.value; setForm(v => ({ ...v, date })) }} onChange={e => { const date = e.currentTarget.value; setForm(v => ({ ...v, date })) }} /></label><label>Access note <span className="optional">optional</span><input placeholder="Landmark or safe access detail" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label></div>
          <div className="privacy-note"><Info size={15} /><span>Use a nearby landmark in this demo. Do not post a child’s address or personal information.</span></div><button className="button button-primary" type="submit"><Plus size={16} /> Save collection request</button>
        </form>
      </section>}
      <section className="panel request-panel"><SectionTitle title={collector ? 'Available tasks' : 'Collection requests'} detail={`${requests.length} saved locally`} action={<span className="small-label">Updated in this browser</span>} />
        <div className="request-list">{requests.filter(r => !collector || r.status !== 'Completed').map(r => <div className="request-card" key={r.id}><div className="request-heading"><div><span className="request-id">{r.id}</span><h3>{r.suburb}</h3></div><StatusTag status={r.status} /></div><CollectionProgress status={r.status} /><div className="request-data"><span><Package size={14} />{r.materials.join(', ')}</span><span><FileText size={14} />Preferred {r.date}</span><span><MapMarkerIcon />{r.note}</span>{r.quantityDisplay && <span><CheckCircle2 size={14} />Recorded {r.quantityDisplay}</span>}</div>
          {collector && r.status === 'Awaiting collector' && <div className="request-actions"><button className="button button-secondary" onClick={() => { updateRequest(r.id, 'Assigned'); notice(`${r.id} accepted. Contact the resident through the agreed local channel.`) }}>Accept task</button></div>}
          {collector && r.status === 'Assigned' && <div className="request-actions quantity-entry"><label className="compact-input">Collected quantity<input aria-label={`Collected quantity for ${r.id}`} type="number" min="0.001" step="any" inputMode="decimal" value={quantities[r.id]?.value || ''} onChange={e => setQuantities(v => ({ ...v, [r.id]: { value: e.target.value, unit: v[r.id]?.unit ?? 'kg' } }))} placeholder="e.g. 12" /></label><label className="compact-input">Unit<select aria-label={`Quantity unit for ${r.id}`} value={quantities[r.id]?.unit ?? 'kg'} onChange={e => setQuantities(v => ({ ...v, [r.id]: { value: v[r.id]?.value ?? '', unit: e.target.value as QuantityUnit } }))}>{quantityUnits.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></label><button className="button button-primary" onClick={() => { const value = Number(quantities[r.id]?.value); const unit = quantities[r.id]?.unit ?? 'kg'; if (!Number.isFinite(value) || value <= 0) { notice('Enter a positive quantity and choose its unit.'); return } updateRequest(r.id, 'Collected', { value, unit }); notice(`${r.id}: ${formatMeasurement({ value, unit })} recorded. Complete the task when the handoff is finished.`) }}>Record collected quantity</button></div>}
          {collector && r.status === 'Collected' && <div className="request-actions"><span className="collected-confirmation"><CheckCircle2 size={16} />Quantity recorded. Confirm the handoff is complete.</span><button className="button button-primary" onClick={() => { updateRequest(r.id, 'Completed'); notice(`${r.id} marked complete.`) }}>Complete task</button></div>}
        </div>)}{!requests.length && <Empty>No collection requests yet. Create one to start the local workflow.</Empty>}</div>
        {!collector && <div className="request-foot"><Info size={14} />Task status and quantities are demonstration records saved to this browser.</div>}
      </section>
    </div>
    <USSD requests={requests} updateRequest={updateRequest} notice={notice} />
  </>
}
function MapMarkerIcon() { return <Info size={14} /> }

function USSD({ requests, updateRequest, notice }: { requests: Request[]; updateRequest: (id: string, status: string, quantity?: Measurement) => void; notice: (s: string) => void }) {
  const [stage, setStage] = useState<'menu' | 'accept' | 'confirm' | 'quantity' | 'finish' | 'done'>('menu')
  const [text, setText] = useState('')
  const [input, setInput] = useState('')
  const [chosen, setChosen] = useState('')
  const [quantity, setQuantity] = useState<Measurement | null>(null)
  const [lines, setLines] = useState<string[]>(['*333# — Harare Resource Loop', 'Welcome. This is a workflow simulation, not a telecom connection.'])
  const available = requests.find(r => r.status === 'Awaiting collector' || r.status === 'Assigned')
  const send = (e: FormEvent) => { e.preventDefault(); const value = input.trim(); if (!value) return; setLines(v => [...v, `> ${value}`]); setInput('')
    if (stage === 'menu' && value === '1') { setText(`Assigned tasks (${available ? 1 : 0}): ${available ? `${available.id} · ${available.suburb} · ${available.materials.join(', ')}` : 'No open tasks.'}`); setStage('accept') }
    else if (stage === 'accept' && value === '2') { if (available) { updateRequest(available.id, 'Assigned'); setChosen(available.id); setText(`${available.id} accepted. Travel to ${available.suburb}.`); setStage('confirm') } else setText('No task is available to accept.') }
    else if (stage === 'confirm' && value === '3') { setText('Collection confirmed. Enter quantity using option 4.'); setStage('quantity') }
    else if (stage === 'quantity' && value === '4') { setText('Enter quantity and unit (for example, 8 kg).'); setStage('finish') }
    else if (stage === 'finish' && value === '5') { if (!quantity) { setText('Enter a positive quantity and unit first, then choose 5 to finish.'); return } if (chosen) updateRequest(chosen, 'Completed'); setText(`${chosen || 'Task'} marked complete · ${formatMeasurement(quantity)} recorded. Thank you.`); setStage('done'); notice('USSD demo task completed.') }
    else if (stage === 'finish' && !quantity) {
      const measured = parseQuantityInput(value)
      if (!measured) { setText('Enter an amount with a unit, for example 800 g, 8 kg, 0.25 tonnes, or 2 bags.'); return }
      setQuantity(measured)
      if (chosen) updateRequest(chosen, 'Collected', measured)
      setText(`Quantity saved as ${formatMeasurement(measured)}. Enter 5 to finish the handoff.`)
    }
    else if (stage === 'menu' && value === '0') { setText('Session ended.'); setStage('done') }
    else setText(stage === 'menu' ? 'Choose 1 to view tasks or 0 to exit.' : 'That option is not available at this step. Follow the next menu option shown.')
    setLines(v => [...v, `HRL: ${stage === 'menu' && value === '1' ? 'Enter 2 to accept a task.' : stage === 'accept' ? 'Enter 2 to accept.' : stage === 'confirm' ? 'Enter 3 when collected.' : stage === 'quantity' ? 'Enter 4 to record quantity.' : stage === 'finish' ? (quantity ? 'Enter 5 to finish.' : 'Enter the quantity.') : 'Session complete.'}`])
  }
  const reset = () => { setStage('menu'); setChosen(''); setQuantity(null); setText(''); setLines(['*333# — Harare Resource Loop', 'Workflow simulation. No SMS or USSD request is sent.']) }
  return <section className="ussd-section"><div className="ussd-copy"><span className="overline">Designed for basic phones</span><h2>Every collector should be able to close a task.</h2><p>A numbered flow makes the coordination idea testable without assuming every collector has a smartphone or mobile data.</p><div className="ussd-steps"><span><b>1</b> View tasks</span><span><b>2</b> Accept</span><span><b>3</b> Confirm pickup</span><span><b>4</b> Record quantity</span><span><b>5</b> Finish</span></div><div className="sim-warning"><Info size={15} />Simulated USSD menu · no carrier integration</div></div><div className="ussd-phone"><div className="phone-top"><span>Demo handset</span><span>Offline</span></div><div className="phone-screen" role="log" aria-live="polite">{lines.slice(-6).map((line, i) => <div key={`${line}-${i}`}>{line}</div>)}{text && <div className="ussd-response">{text}</div>}{stage === 'menu' && <div className="ussd-options">1 View assigned tasks<br />2 Accept task<br />3 Confirm collection<br />4 Enter quantity<br />5 Finish job<br />0 Exit</div>}</div><form className="ussd-input" onSubmit={send}><label className="sr-only" htmlFor="ussd-entry">Enter USSD menu option</label><input id="ussd-entry" value={input} onChange={e => setInput(e.target.value)} placeholder="Enter menu option / quantity" /><button aria-label="Send USSD response"><ArrowRight size={17} /></button></form><button className="ussd-reset" onClick={reset}>Restart simulation</button></div></section>
}

function Marketplace({ role, listings, setListings, interested, setInterested, notice }: { role: Role; listings: Listing[]; setListings: Dispatch<SetStateAction<Listing[]>>; interested: string[]; setInterested: Dispatch<SetStateAction<string[]>>; notice: (s: string) => void }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All materials')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ material: 'PET', quantity: '', location: 'Mbare', condition: 'Clean, dry', cleanliness: 'Rinsed / clean', sorting: 'Sorted by type', availability: 'Available this week', price: 'Quotation requested', preference: 'Pickup preferred', description: '' })
  const filtered = listings.filter(l => (filter === 'All materials' || l.material === filter) && `${l.material} ${l.location} ${l.description}`.toLowerCase().includes(query.toLowerCase()))
  const create = (e: FormEvent) => { e.preventDefault(); if (!form.quantity.trim()) { notice('Add a quantity so buyers can assess the offer.'); return }
    const next: Listing = { ...form, id: `MAT-${Math.floor(100 + Math.random() * 900)}`, seller: role === 'Recycler/Buyer' ? 'Buyer listing' : 'Local demo seller' }; setListings(current => [next, ...current]); setShowForm(false); notice(`${form.material} listing added to the local marketplace.`); setForm(v => ({ ...v, quantity: '', description: '' })) }
  return <>
    <PageHeader eyebrow="Materials exchange" title="Resource marketplace" description="Match sorted materials with reuse and recovery demand. Listings are coordination records; prices remain quotation-led." action={<button className="button button-primary" onClick={() => setShowForm(v => !v)}><Plus size={16} /> List a material</button>} />
    <div className="market-intro"><div className="market-search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search materials, locations, or keywords" aria-label="Search marketplace listings" /></div><label className="filter-control"><Filter size={15} /><select aria-label="Filter material type" value={filter} onChange={e => setFilter(e.target.value)}><option>All materials</option>{listingMaterials.map(m => <option key={m}>{m}</option>)}</select><ChevronDown size={14} /></label></div>
    <MaterialCatalog selected={filter} onSelect={setFilter} />
    {showForm && <section className="panel listing-form-panel"><SectionTitle title="Create a material listing" detail="State what you know; the buyer can confirm suitability and price." /><form className="stack-form" onSubmit={create}><div className="form-three"><label>Material<select value={form.material} onChange={e => setForm({ ...form, material: e.target.value })}>{listingMaterials.map(m => <option key={m}>{m}</option>)}</select></label><label>Quantity<input required placeholder="e.g. 25 kg" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></label><label>Location<select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>{suburbs.map(s => <option key={s}>{s}</option>)}</select></label></div><div className="form-three"><label>Material condition<select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>{['Clean, dry', 'Mixed condition', 'Baled', 'Damaged', 'Fresh'].map(x => <option key={x}>{x}</option>)}</select></label><label>Cleanliness<input value={form.cleanliness} onChange={e => setForm({ ...form, cleanliness: e.target.value })} /></label><label>Sorting status<select value={form.sorting} onChange={e => setForm({ ...form, sorting: e.target.value })}>{['Sorted by type', 'Unsorted', 'Separate stream'].map(x => <option key={x}>{x}</option>)}</select></label></div><div className="form-three"><label>Availability<input value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })} /></label><label>Price expectation<select value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}>{['Quotation requested', 'Open to quotation', 'Free for reuse', 'Price negotiable'].map(x => <option key={x}>{x}</option>)}</select></label><label>Pickup / delivery<select value={form.preference} onChange={e => setForm({ ...form, preference: e.target.value })}>{['Pickup preferred', 'Pickup only', 'Delivery available', 'Buyer collection'].map(x => <option key={x}>{x}</option>)}</select></label></div><label>Description<textarea rows={2} placeholder="Contamination, packaging, or other useful details" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><div className="form-actions"><button className="button button-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary"><Plus size={15} /> Publish local listing</button></div></form></section>}
    <div className="market-grid">{filtered.map(l => <article className="listing-card" key={l.id}><div className="listing-top"><span className="material-mark"><Recycle size={19} /></span><span className="status-tag neutral">{l.material}</span><button className="icon-button save-listing" title="Contact seller in demo mode" onClick={() => { if (!interested.includes(l.id)) setInterested(v => [...v, l.id]); notice(`Interest recorded for ${l.id}. Exchange contact details through an agreed local channel.`) }}><MessageCircle size={17} /><span>{interested.includes(l.id) ? 'Interested' : 'Contact'}</span></button></div><h3>{l.quantity} of {l.material}</h3><p className="listing-description">{l.description || 'Material offered for reuse or recovery.'}</p><div className="listing-specs"><span><MapMarkerIcon />{l.location}</span><span><CheckCircle2 size={14} />{l.condition} · {l.cleanliness}</span><span><Filter size={14} />{l.sorting}</span><span><Truck size={14} />{l.preference}</span></div><div className="listing-bottom"><span>{l.availability}</span><strong>{l.price}</strong></div></article>)}{!filtered.length && <Empty>No listing matches that search. Clear your filters or create a new material offer.</Empty>}</div>
    <section className="reference-banner"><div className="reference-icon"><Info size={18} /></div><div><strong>Price references are not live quotations</strong><p>Stable Packaging in Masvingo was reported to pay about US$0.35–US$0.40/kg for collected plastic in 2023. This is a historical reference and does not predict today’s local offer.</p><Source href="https://news.mongabay.com/2023/08/zimbabwe-sees-recycling-boom-as-waste-picking-becomes-lucrative-business/" tag="Historical price · 2023">Mongabay reporting · Stable Packaging</Source></div></section>
    <section className="buyer-note"><strong>Buyer note · Waverley Plastics</strong><span>Published requirements refer to suitable HDPE and LDPE; payment depends on quality and sorting. No fixed current price is listed here. Confirm acceptance and terms directly before transport.</span></section>
  </>
}

function ReuseStudio({ notice }: { notice: (s: string) => void }) {
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const [question, setQuestion] = useState('What could I make or do with this instead of throwing it away?')
  const [skill, setSkill] = useState('I can do simple repairs')
  const [messages, setMessages] = useState<{ from: 'you' | 'assistant'; text: string; ideas?: string[] }[]>([{ from: 'assistant', text: 'Tell me what the item is made from and what condition it is in. I use local guidance rules in this demo; an uploaded image is previewed only and is not analysed by an AI model.' }])
  const imageFile = (e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) { notice('Choose an image file to preview.'); return } const reader = new FileReader(); reader.onload = () => setImage(String(reader.result)); reader.readAsDataURL(file) }
  const ask = async (e: FormEvent) => {
    e.preventDefault()
    if (!description.trim() && !image) { notice('Describe the material or add an image preview first.'); return }
    const result = await localReuseProvider.suggest({ description, question, skill, imageAttached: Boolean(image) })
    setMessages(v => [
      ...v,
      { from: 'you', text: `${description || 'Image attached'} · ${question}` },
      { from: 'assistant', text: result.message, ideas: result.ideas },
    ])
    setQuestion('')
    notice('Local reuse suggestions generated from your description.')
  }

  return <>
    <PageHeader eyebrow="Prevent waste · extend useful life" title="Reuse studio" description="Describe an item and explore a repair, second-use, or recovery path that fits your tools and skills." action={<span className="outline-pill"><Leaf size={14} /> Local guidance</span>} />
    <div className="reuse-layout"><section className="reuse-chat panel"><div className="chat-title"><div className="assistant-avatar"><Sprout size={19} /></div><div><strong>Resource guide</strong><small><span className="online-dot" /> Local demonstration provider</small></div><span className="local-only">No external AI</span></div><div className="chat-messages" role="log" aria-live="polite">{messages.map((m, i) => <div className={`chat-message ${m.from}`} key={i}><div className="chat-bubble"><p>{m.text}</p>{m.ideas && <ul>{m.ideas.map(idea => <li key={idea}>{idea}</li>)}</ul>}</div>{m.from === 'assistant' && <small>Rule-based guidance · image not analysed</small>}</div>)}</div>
      <form className="reuse-form" onSubmit={ask}><div className="reuse-attachment">{image ? <div className="image-preview"><img src={image} alt="Your item preview" /><button type="button" aria-label="Remove image" onClick={() => setImage('')}><X size={15} /></button></div> : <label className="upload-tile"><Upload size={17} /><span>Add a photo</span><small>Image preview only · optional</small><input type="file" accept="image/*" onChange={imageFile} /></label>}<label>Material and condition<textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="For example: an empty 2 litre PET bottle, rinsed and intact" /></label></div><div className="form-two"><label>Skills you have<select value={skill} onChange={e => setSkill(e.target.value)}><option>I can do simple repairs</option><option>I can sew</option><option>I can craft</option><option>I have no tools or special skills</option></select></label><label>Your question<input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask about repair, reuse, or recycling" /></label></div><div className="reuse-actions"><span>Suggestions are generated on this device from curated material rules.</span><button className="button button-primary"><MessageCircle size={15} /> Ask for ideas</button></div></form>
    </section><aside className="reuse-aside"><section className="panel guide-card"><span className="overline">A simple reuse check</span><ol><li><b>1</b><span><strong>Identify</strong><small>Find the material and original use.</small></span></li><li><b>2</b><span><strong>Check safety</strong><small>Look for contamination, sharp edges, or damage.</small></span></li><li><b>3</b><span><strong>Extend its life</strong><small>Repair, refill, donate, then recycle.</small></span></li></ol></section><div className="safety-callout"><ShieldCheck size={18} /><div><strong>Safety first</strong><p>Never reuse a container that held hazardous chemicals for food or water. Do not cut, heat, burn, or dismantle unknown materials.</p></div></div><div className="future-provider"><span className="overline">Designed for future providers</span><p>The interface calls a provider boundary. A future image-understanding service can run behind a server endpoint without changing this chat.</p><code>ReuseProvider → local rules</code></div></aside></div>
  </>
}

const compostSteps = [
  { title: 'Separate the feedstock', body: 'Keep fruit and vegetable scraps, coffee grounds, dry leaves and small garden trimmings apart from plastics, glass and residual waste.', type: 'Start' },
  { title: 'Balance green and brown', body: 'Green nitrogen-rich materials include fresh grass and kitchen scraps. Brown carbon-rich materials include dry leaves, shredded paper and small untreated twigs. Add a mix rather than a single wet layer.', type: 'Balance' },
  { title: 'Manage moisture and air', body: 'Aim for a damp sponge feel, not dripping wet. Cover heavy rain, add dry browns if it smells or becomes soggy, and turn or loosen the pile to let air through.', type: 'Maintain' },
  { title: 'Wait for a stable, earthy finish', body: 'Mature compost is dark, crumbly and smells earthy; recognisable food pieces have mostly broken down. Screen coarse pieces and return them to a new pile.', type: 'Finish' },
]
const reuseGuides = [
  { material: 'Bottles', idea: 'Clean PET bottle → seedling pot or drip-water container; sort for recycling when it is no longer usable.' },
  { material: 'Plastic containers', idea: 'Reuse only clean, food-safe containers for suitable purposes. Never use a container that held hazardous chemicals for food or water.' },
  { material: 'Glass bottles', idea: 'Reuse intact jars for dry storage. Keep chipped or broken glass out of mixed streams and follow local handling guidance.' },
  { material: 'Clothes', idea: 'Repair a seam, pass wearable pieces on after confirming the receiving organisation’s needs, or sort clean textiles for recovery.' },
  { material: 'Tyres', idea: 'Check for a recovery route. Repurposed tyres must be stable, drained and protected from fire; do not let water pool inside.' },
  { material: 'Wood', idea: 'Sound untreated offcuts can support small repairs. Avoid burning treated or painted wood, especially indoors.' },
  { material: 'Paper & cardboard', idea: 'Keep dry and clean; flatten boxes for storage or material recovery. Food-soiled and wax-coated items may not be accepted.' },
]
function Learn() {
  const [tab, setTab] = useState<'compost' | 'reuse'>('compost')
  return <>
    <PageHeader eyebrow="Practical knowledge" title="Learn & compost" description="Small household choices improve material quality and keep organics out of residual waste." action={<span className="outline-pill"><Sprout size={14} /> Field guide</span>} />
    <div className="segmented-tabs" role="tablist" aria-label="Learning guides"><button role="tab" aria-selected={tab === 'compost'} className={tab === 'compost' ? 'selected' : ''} onClick={() => setTab('compost')}>Compost basics</button><button role="tab" aria-selected={tab === 'reuse'} className={tab === 'reuse' ? 'selected' : ''} onClick={() => setTab('reuse')}>Reuse ideas</button></div>
    {tab === 'compost' ? <><section className="compost-hero"><div className="compost-mark"><Sprout size={30} /></div><div><span className="overline">A manageable home or school compost pile</span><h2>Feed soil, not the dump.</h2><p>Start small with a ventilated container or covered pile. Keep non-compostable packaging and hazardous materials out.</p></div></section><div className="guide-grid">{compostSteps.map((step, i) => <article className="guide-step" key={step.title}><span className="step-no">0{i + 1}</span><span className="step-type">{step.type}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div><div className="compost-check"><div><strong>Quick troubleshooting</strong><span>Smell? Add dry browns and turn. Too dry? Add a little water and green material. Pests? Bury scraps in the centre, cover the pile, and avoid meat, dairy and oily food scraps in a basic household system.</span></div><div className="maturity-note"><CheckCircle2 size={18} /><span>Use finished compost mixed into garden soil; do not apply fresh scraps directly around plant roots.</span></div></div></> : <div className="reuse-guides">{reuseGuides.map(item => <article key={item.material}><span className="guide-material"><Recycle size={16} /></span><div><h3>{item.material}</h3><p>{item.idea}</p></div><span className="guide-arrow"><ArrowRight size={16} /></span></article>)}</div>}
    <div className="safety-callout wide"><ShieldCheck size={18} /><div><strong>Handle materials safely</strong><p>Keep sharps and unknown chemical containers separate. Do not burn waste, mix hazardous residues into compost, or reuse chemical containers for food or drinking water.</p></div></div>
  </>
}

function Books({ books, setBooks, addActivity, notice }: { books: Book[]; setBooks: Dispatch<SetStateAction<Book[]>>; addActivity: (activity: Omit<Activity, 'id' | 'status' | 'public'>) => void; notice: (s: string) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [interestedBooks, setInterestedBooks] = useStored<string[]>('book-interest', [])
  const [exchangedBooks, setExchangedBooks] = useStored<string[]>('book-exchanged', [])
  const [form, setForm] = useState({ title: '', grade: 'Grade 7', subject: 'Mathematics', edition: '', condition: 'Good', offer: 'Exchange', location: 'Mbare' })
  const create = (e: FormEvent) => { e.preventDefault(); const book: Book = { ...form, id: `BK-${Date.now().toString().slice(-4)}`, edition: form.edition || 'Edition to confirm', owner: 'Community member' }; setBooks(v => [book, ...v]); setShowForm(false); notice('Textbook offer saved locally. Please confirm the edition with the next student.') }
  return <>
    <PageHeader eyebrow="Keep learning materials in use" title="Books & schools" description="Match a textbook to the next student, a school book bank, or a community library before paper recovery." action={<button className="button button-primary" onClick={() => setShowForm(v => !v)}><Plus size={16} /> List a textbook</button>} />
    <section className="book-case"><div className="book-case-mark"><BookOpen size={24} /></div><div className="book-case-copy"><span className="overline">Existing case study · organisation-published account</span><h2>Books on Wheels</h2><p>Started in 2014. Its published account reports more than 2,000 library books purchased and nearly 400 children exchanging books weekly.</p><Source href="https://ndeipi.co.zw/books-on-wheels/" tag="Company-reported · historical published figures">Books on Wheels · Ndeipi</Source></div><div className="book-case-stats"><span><strong>2,000+</strong><small>books bought for library</small></span><span><strong>~400</strong><small>weekly exchanges reported</small></span><span><strong>2014</strong><small>initiative started</small></span></div><p className="history-note">The same published account listed US$10 monthly unlimited exchange, US$25/term for new members and US$20/term for existing members. These are historical reported prices, not current membership terms.</p></section>
    {showForm && <section className="panel book-form-panel"><SectionTitle title="List a used textbook" detail="Include edition details so the next student can check curriculum fit." /><form className="stack-form" onSubmit={create}><div className="form-two"><label>Book title<input required value={form.title} placeholder="e.g. Mathematics Form 2" onChange={e => setForm({ ...form, title: e.target.value })} /></label><label>Curriculum edition<input value={form.edition} placeholder="Publisher / edition year" onChange={e => setForm({ ...form, edition: e.target.value })} /></label></div><div className="form-three"><label>Grade<select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>{['Grade 7', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'].map(x => <option key={x}>{x}</option>)}</select></label><label>Subject<input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></label><label>Condition<select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>{['Like new', 'Good', 'Fair · repairable', 'Damaged'].map(x => <option key={x}>{x}</option>)}</select></label></div><div className="form-two"><label>Offer<select value={form.offer} onChange={e => setForm({ ...form, offer: e.target.value })}>{['Exchange', 'Donation', 'For sale'].map(x => <option key={x}>{x}</option>)}</select></label><label>Location<select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>{suburbs.map(s => <option key={s}>{s}</option>)}</select></label></div><div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary">Save book listing</button></div></form></section>}
    <div className="section-title"><div><h2>Books available</h2><p>Edition and condition should be confirmed before a handover.</p></div><span className="small-label">{books.length} local listings</span></div><div className="book-list">{books.map(book => <article className="book-row" key={book.id}><div className="book-cover"><BookOpen size={21} /></div><div className="book-details"><span className="overline">{book.id} · {book.grade} · {book.subject}</span><h3>{book.title}</h3><span>{book.edition} · {book.condition}</span><small>{book.location} · {book.owner}</small></div><div className="book-destination"><span className="offer-badge">{exchangedBooks.includes(book.id) ? 'Exchange recorded' : book.offer}</span><p>Good next steps</p><span>Student reuse · sibling exchange · school book bank · community library · repair</span></div>{!interestedBooks.includes(book.id) && !exchangedBooks.includes(book.id) && <button className="button button-secondary" onClick={() => { setInterestedBooks(v => [...v, book.id]); notice(`Interest in ${book.title} recorded. Arrange a safe handover with the listing owner.`) }}>Register interest</button>}{interestedBooks.includes(book.id) && !exchangedBooks.includes(book.id) && <button className="button button-primary" onClick={() => { setExchangedBooks(v => [...v, book.id]); addActivity({ name: `Textbook exchange: ${book.title}`, date: today, location: book.location, organisation: 'Peer-to-peer student exchange', role: 'Book exchange participant', skills: ['Book reuse'], type: 'Book exchange', description: 'Handover reported by participant; recipient is not identified and receipt is not independently verified.' }); notice('Book handover recorded as self-reported.') }}>Confirm completed handover</button>}{exchangedBooks.includes(book.id) && <span className="book-complete"><CheckCircle2 size={15} />Self-reported handover</span>}</article>)}</div>
    <section className="last-resort"><span><Recycle size={17} /></span><div><strong>Paper recycling is the last stop</strong><p>First try student reuse, sibling exchange, a school book bank, community library, donation, or repair. Recycle only when a book is no longer safe or useful to read.</p></div></section>
  </>
}

function Community({ role, targetCampaignId, activities, setActivities, campaigns, setCampaigns, registrations, setRegistrations, joined, setJoined, displayName, setDisplayName, publicProfile, setPublicProfile, addActivity, notice }: { role: Role; targetCampaignId: string | null; activities: Activity[]; setActivities: Dispatch<SetStateAction<Activity[]>>; campaigns: Campaign[]; setCampaigns: Dispatch<SetStateAction<Campaign[]>>; registrations: string[]; setRegistrations: Dispatch<SetStateAction<string[]>>; joined: string[]; setJoined: Dispatch<SetStateAction<string[]>>; displayName: string; setDisplayName: Dispatch<SetStateAction<string>>; publicProfile: boolean; setPublicProfile: Dispatch<SetStateAction<boolean>>; addActivity: (activity: Omit<Activity, 'id' | 'status' | 'public'>) => void; notice: (s: string) => void }) {
  const [tab, setTab] = useState<'organisations' | 'campaigns' | 'events' | 'profile'>('organisations')
  useEffect(() => { if (targetCampaignId) setTab('campaigns') }, [targetCampaignId])
  useEffect(() => {
    if (tab !== 'campaigns' || !targetCampaignId) return
    const frame = window.requestAnimationFrame(() => document.getElementById(`campaign-${targetCampaignId}`)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }))
    return () => window.cancelAnimationFrame(frame)
  }, [tab, targetCampaignId])
  const [orgQuery, setOrgQuery] = useState('')
  const [donationOpen, setDonationOpen] = useState(false)
  const [donation, setDonation] = useState({ organisation: organisations[0].name, category: 'Books and educational materials', date: today, description: '' })
  const [showCampaignForm, setShowCampaignForm] = useState(false)
  const [contributions, setContributions] = useState<Record<string, string>>({})
  const [shareLink, setShareLink] = useState('')
  const [campaignForm, setCampaignForm] = useState({ name: '', organisation: organisations[0].name, objective: '', categories: 'School stationery', start: today, end: '', target: '20', arrangement: 'Coordinate directly with the organisation' })
  const filteredOrgs = organisations.filter(o => `${o.name} ${o.category} ${o.location}`.toLowerCase().includes(orgQuery.toLowerCase()))
  const activeCampaign = targetCampaignId ? campaigns.find(campaign => campaign.id === targetCampaignId) : undefined
  const recordDonation = (e: FormEvent) => { e.preventDefault(); if (!donation.description.trim()) { notice('Describe the completed contribution before saving the self-reported record.'); return } addActivity({ name: `${donation.category} contribution`, date: donation.date, location: 'Private coordination with organisation', organisation: donation.organisation, role: 'Donor', skills: [], type: 'Donation', description: donation.description }); setDonationOpen(false); setDonation(v => ({ ...v, description: '' })); notice('Donation saved as self-reported. The organisation has not confirmed receipt.') }
  const createCampaign = (e: FormEvent) => { e.preventDefault(); const c: Campaign = { id: `CAM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, name: campaignForm.name, organisation: campaignForm.organisation, objective: campaignForm.objective, categories: campaignForm.categories.split(',').map(x => x.trim()).filter(Boolean), start: campaignForm.start, end: campaignForm.end, organiser: displayName || 'Community organiser', target: Math.max(1, Number(campaignForm.target) || 1), progress: 0, members: 1, arrangement: campaignForm.arrangement, status: 'Active' }; setCampaigns(v => [c, ...v]); setJoined(v => [...v, c.id]); setShowCampaignForm(false); setTab('campaigns'); notice('Group campaign created locally. No funds are collected by this platform.') }
  const joinCampaign = (c: Campaign) => { if (joined.includes(c.id)) { notice('You are already in this local campaign.'); return } setJoined(v => [...v, c.id]); setCampaigns(v => v.map(item => item.id === c.id ? { ...item, members: item.members + 1 } : item)); notice('You joined the group drive. Coordinate any delivery with the organisation.') }
  const contribute = (c: Campaign) => { const amount = Number(contributions[c.id]); if (!Number.isFinite(amount) || amount <= 0) { notice('Enter a positive contribution count before recording it.'); return } setCampaigns(v => v.map(item => item.id === c.id ? { ...item, progress: Math.min(item.target, item.progress + amount), status: item.progress + amount >= item.target ? 'Completed' : item.status } : item)); addActivity({ name: `Group contribution to ${c.name}`, date: today, location: 'Coordinated by group organiser', organisation: c.organisation, role: 'Group member', skills: ['Teamwork'], type: 'Campaign', description: `Participant-reported contribution of ${amount} units. Receipt not independently verified.` }); setContributions(v => ({ ...v, [c.id]: '' })); notice(`${amount} contribution units recorded as a self-reported group update.`) }
  const register = (event: Event) => { if (eventHasOccurred(event.date, localDateISO())) { notice('This demonstration event has already taken place.'); return } if (registrations.includes(event.id)) return; setRegistrations(v => [...v, event.id]); notice(`Interest registered for ‘${event.name}’. Confirm final arrangements with its organiser.`) }
  const attendance = (event: Event) => { if (!eventHasOccurred(event.date, localDateISO())) { notice('Attendance can only be recorded after the scheduled event date.'); return } if (!registrations.includes(event.id)) { notice('Register interest before recording attendance.'); return } if (activities.some(a => a.name === event.name && a.type === 'Volunteer')) { notice('Attendance has already been recorded for this activity.'); return } addActivity({ name: event.name, date: event.date, location: event.location, organisation: event.organiser, role: 'Volunteer participant', hours: event.hours, skills: event.skills.split(',').map(x => x.trim()), type: 'Volunteer', description: 'Attendance and hours entered by participant; organiser has not confirmed.' }); notice('Attendance saved as self-reported.') }
  const verify = (activity: Activity) => { if (role !== 'Operator') { notice('Switch to the Operator demonstration role to simulate an organiser review.'); return } if (activity.status === 'Organisation-verified') { notice('This record has reached the final simulated review state.'); return } setActivities(v => v.map(a => a.id !== activity.id ? a : a.status === 'Self-reported' ? { ...a, status: 'Organiser-confirmed', verifiedBy: 'Simulated event organiser' } : a.status === 'Organiser-confirmed' ? { ...a, status: 'Organisation-verified', verifiedBy: 'Simulated organisation representative' } : a)); notice(activity.status === 'Self-reported' ? 'Simulated organiser confirmation recorded.' : 'Simulated organisation review recorded.') }
  const togglePublic = (id: string) => setActivities(v => v.map(a => a.id === id ? { ...a, public: !a.public } : a))
  const exportRecord = (shareable = false) => {
    const records = shareable ? activities.filter(a => a.public) : activities
    const html = buildContributionReportHtml(displayName, records, today, shareable)
    const reportWindow = window.open('', '_blank')
    if (!reportWindow) { notice('Allow this site to open a report window, then choose Print / Save as PDF.'); return }
    reportWindow.document.open()
    reportWindow.document.write(html)
    reportWindow.document.close()
    reportWindow.focus()
    let didPrint = false
    const print = () => { if (didPrint || reportWindow.closed) return; didPrint = true; reportWindow.print() }
    reportWindow.addEventListener('load', print, { once: true })
    window.setTimeout(print, 300)
    notice('Choose Save as PDF in the print dialog to create your report.')
  }
  const share = async (id: string) => { const url = `${location.origin}${location.pathname}${campaignShareHash(id)}`; try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(url); setShareLink(''); notice('Campaign link copied. The invite opens only when this browser has the campaign record.') } catch { setShareLink(url); notice('Clipboard unavailable. The campaign link is shown below.') } }
  return <>
    <PageHeader eyebrow="Community participation" title="Community & giving" description="Support organisations through their own channels, join group drives, and keep a transparent record of participation." action={<button className="button button-primary" onClick={() => setDonationOpen(v => !v)}><HeartHandshake size={16} /> Record a completed contribution</button>} />
    <div className="safeguarding-banner"><ShieldCheck size={18} /><div><strong>Safeguarding and privacy are essential</strong><span>Coordinate visits through the organisation. Never contact children directly, publish recipient identities, or make photos and personal stories a condition of support.</span></div></div>
    {donationOpen && <section className="panel donation-form-panel"><SectionTitle title="Record a completed contribution" detail="The platform does not process donations. Your entry is private and self-reported until an organisation confirms it." /><form onSubmit={recordDonation} className="stack-form"><div className="form-three"><label>Organisation<select value={donation.organisation} onChange={e => setDonation({ ...donation, organisation: e.target.value })}>{organisations.map(o => <option key={o.name}>{o.name}</option>)}</select></label><label>Contribution type<select value={donation.category} onChange={e => setDonation({ ...donation, category: e.target.value })}>{['Books and educational materials', 'School stationery', 'Clothing and shoes', 'Bedding', 'Toiletries', 'Food supplies', 'Gardening tools and seeds', 'Computers and learning equipment', 'Furniture', 'Financial contribution via official channel', 'Volunteer support'].map(x => <option key={x}>{x}</option>)}</select></label><label>Date completed<input type="date" max={today} value={donation.date} onInput={e => { const date = e.currentTarget.value; setDonation(v => ({ ...v, date })) }} onChange={e => { const date = e.currentTarget.value; setDonation(v => ({ ...v, date })) }} /></label></div><label>Private note about your contribution<textarea rows={2} value={donation.description} onChange={e => setDonation({ ...donation, description: e.target.value })} placeholder="Do not include a recipient's name or sensitive personal information." /></label><div className="form-actions"><span className="field-hint">By saving, you confirm the contribution is complete. The organisation has not confirmed receipt.</span><button type="button" className="button button-secondary" onClick={() => setDonationOpen(false)}>Cancel</button><button className="button button-primary">Save self-reported record</button></div></form></section>}
    <div className="segmented-tabs community-tabs" role="tablist" aria-label="Community tools">{([['organisations', 'Organisations'], ['campaigns', 'Group drives'], ['events', 'Volunteer & events'], ['profile', 'My participation']] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === 'organisations' && <><div className="directory-tools"><div className="market-search"><Search size={16} /><input value={orgQuery} onChange={e => setOrgQuery(e.target.value)} placeholder="Search organisations or category" aria-label="Search organisations" /></div><span className="small-label">Source-linked directory · current details should be reconfirmed</span></div><div className="organisation-grid">{filteredOrgs.map(org => <article className="organisation-card" key={org.name}><div className="org-card-top"><span className="org-emblem"><HeartHandshake size={17} /></span><span className="review-status">Published source linked · details to confirm</span></div><span className="overline">{org.category}</span><h3>{org.name}</h3><p className="org-location"><MapMarkerIcon /> {org.location}</p><p className="org-needs">{org.needs.split('. ')[0]}{org.needs.includes('. ') ? '.' : ''}</p><details className="org-more"><summary>Needs, contact and support details</summary><p>{org.needs}</p><div className="org-details"><div><small>Contact</small><span>{org.contact}</span></div><div><small>Giving & donation options</small><span>{org.giving}</span></div><div><small>Volunteering</small><span>{org.volunteering}</span></div></div><div className="org-meta"><span>Information review</span><strong>{org.reviewedOn}</strong></div><small className="org-caveat">Source links are provided for follow-up. Published information is not independent registration, donation-receipt, or partnership verification.</small></details><div className="org-actions"><a className="button button-secondary" href={org.website} target="_blank" rel="noreferrer">Official website <ArrowUpRight size={14} /></a><a className="org-text-link" href={org.support} target="_blank" rel="noreferrer">Support page <ArrowUpRight size={13} /></a></div></article>)}</div><div className="giving-reminder"><Info size={16} /><span>Check current needs before delivering goods. Financial contributions go directly through the organisation’s official channel; this app does not collect money. No personal bank accounts are listed.</span></div></>}
    {tab === 'campaigns' && <>{activeCampaign && <div className="shared-campaign-note"><Info size={16} /><span>Campaign invite: <strong>{activeCampaign.name}</strong> · local demo record</span></div>}{shareLink && <div className="share-link-note"><label>Campaign link<input readOnly value={shareLink} aria-label="Campaign invite link" onFocus={e => e.currentTarget.select()} /></label><button type="button" className="button button-secondary" onClick={async () => { try { await navigator.clipboard.writeText(shareLink); setShareLink(''); notice('Campaign link copied.') } catch { notice('Select the campaign URL and copy it from your browser.') } }}>Copy link</button></div>}<div className="campaign-top"><div><h2>Organised giving, without a wallet</h2><p>Groups coordinate collection and delivery; any cash support goes straight to the organisation.</p></div><button className="button button-primary" onClick={() => setShowCampaignForm(v => !v)}><Plus size={15} /> Create group drive</button></div>{showCampaignForm && <section className="panel campaign-form-panel"><SectionTitle title="Create a group campaign" detail="Campaigns coordinate physical contributions. Do not collect or hold funds in the app." /><form onSubmit={createCampaign} className="stack-form"><div className="form-two"><label>Campaign name<input required value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="e.g. University group school supplies drive" /></label><label>Selected organisation<select value={campaignForm.organisation} onChange={e => setCampaignForm({ ...campaignForm, organisation: e.target.value })}>{organisations.map(o => <option key={o.name}>{o.name}</option>)}</select></label></div><div className="form-two"><label>Objective<textarea required rows={2} value={campaignForm.objective} onChange={e => setCampaignForm({ ...campaignForm, objective: e.target.value })} placeholder="What will the group coordinate?" /></label><label>Target donation categories<input value={campaignForm.categories} onChange={e => setCampaignForm({ ...campaignForm, categories: e.target.value })} /></label></div><div className="form-three"><label>Start date<input type="date" value={campaignForm.start} onInput={e => { const start = e.currentTarget.value; setCampaignForm(v => ({ ...v, start })) }} onChange={e => { const start = e.currentTarget.value; setCampaignForm(v => ({ ...v, start })) }} /></label><label>End date<input type="date" value={campaignForm.end} onInput={e => { const end = e.currentTarget.value; setCampaignForm(v => ({ ...v, end })) }} onChange={e => { const end = e.currentTarget.value; setCampaignForm(v => ({ ...v, end })) }} /></label><label>Contribution target (items/units)<input type="number" min="1" value={campaignForm.target} onChange={e => setCampaignForm({ ...campaignForm, target: e.target.value })} /></label></div><label>Pickup or delivery arrangement<input value={campaignForm.arrangement} onChange={e => setCampaignForm({ ...campaignForm, arrangement: e.target.value })} /></label><div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setShowCampaignForm(false)}>Cancel</button><button className="button button-primary">Create local group drive</button></div></form></section>}<div className="campaign-grid">{campaigns.map(c => <article id={`campaign-${c.id}`} aria-labelledby={`campaign-title-${c.id}`} className={`campaign-card ${targetCampaignId === c.id ? 'campaign-card-highlight' : ''}`} key={c.id}><div className="campaign-card-head"><span className="campaign-status"><span />{c.status}</span><button className="text-button" onClick={() => share(c.id)}>Copy campaign link <ArrowUpRight size={13} /></button></div><span className="overline">{c.organisation}</span><h3 id={`campaign-title-${c.id}`}>{c.name}</h3><p>{c.objective}</p><div className="progress-label"><span>{c.progress} / {c.target} contribution units</span><strong>{Math.min(100, Math.round(c.progress / c.target * 100))}%</strong></div><div className="progress-track" role="progressbar" aria-label={`${c.name} contribution progress`} aria-valuemin={0} aria-valuemax={c.target} aria-valuenow={Math.min(c.target, c.progress)}><span style={{ width: `${Math.min(100, c.progress / c.target * 100)}%` }} /></div><div className="campaign-details"><span><b>{c.members}</b> group members</span><span>{c.categories.join(', ')}</span><span>{c.start} → {c.end || 'End date open'}</span><span>{c.arrangement}</span></div><div className="campaign-actions">{!joined.includes(c.id) ? <button className="button button-primary" onClick={() => joinCampaign(c)}>Join this drive</button> : <div className="contribution-entry"><label>Units to record<input type="number" min="1" value={contributions[c.id] || ""} onChange={e => setContributions(v => ({ ...v, [c.id]: e.target.value }))} /></label><button className="button button-secondary" onClick={() => contribute(c)}>Record contribution</button></div>}<span className="micro-note">Progress and receipts are self-reported.</span></div></article>)}</div></>}
    {tab === 'events' && <>
      <SectionTitle title="Community calendar" detail="Register interest before an event. Attendance opens only after its scheduled date." />
      <div className="event-grid">{eventsSeed.map(event => {
        const registered = registrations.includes(event.id)
        const activity = activities.find(item => item.name === event.name && item.type === 'Volunteer')
        const occurred = eventHasOccurred(event.date, localDateISO())
        const status = activity ? activity.status === 'Self-reported' ? 'Attendance self-reported' : `${activity.status} · simulated` : registered ? 'Registered' : ''
        return <article className="volunteer-card" key={event.id}>
          <div className="volunteer-date"><span>{new Date(`${event.date}T12:00:00`).toLocaleDateString('en', { day: '2-digit' })}</span><small>{new Date(`${event.date}T12:00:00`).toLocaleDateString('en', { month: 'short' })}</small></div>
          <span className="overline">{event.organiser}</span><h3>{event.name}</h3><p>{event.location}</p>
          <div className="event-info"><span>{event.hours} hours · indicated</span><span>Skills: {event.skills}</span><span>{event.places} places · confirm first</span></div>
          <div className="safeguard-mini"><ShieldCheck size={14} />{event.safeguarding}</div>
          {status && <div className="event-status"><StatusTag status={status} /></div>}
          <div className="event-actions">{!registered && !occurred ? <button className="button button-primary" onClick={() => register(event)}>Register interest</button> : !registered ? <button className="button button-secondary" disabled>Event date has passed</button> : activity ? <span className="event-recorded">Attendance is recorded in this browser.</span> : occurred ? <button className="button button-secondary" onClick={() => attendance(event)}>Record attendance (self-reported)</button> : <button className="button button-secondary" disabled>Registered · attendance opens after {event.date}</button>}<small>{registered ? 'Registered locally · no external message sent' : 'Demonstration opportunity · confirm with organiser'}</small></div>
        </article>
      })}</div>
      <div className="footnote"><Info size={14} /><span>Event details are demonstration content. Organiser confirmation is required before attendance; simulated reviews are not external approvals.</span></div>
    </>}
    {tab === 'profile' && <><div className="profile-head"><div><span className="overline">Optional personal record</span><h2>Community contribution profile</h2><p>Keep activity history you can choose to include in a CV or portfolio. Participation does not guarantee employment.</p></div><div className="profile-export-actions"><button className="button button-secondary" onClick={() => exportRecord()}><ArrowDownToLine size={15} /> Print / Save private report as PDF</button><button className="button button-primary" disabled={!publicProfile} onClick={() => exportRecord(true)}><ArrowDownToLine size={15} /> Print / Save shareable report as PDF</button></div></div><section className="panel profile-settings"><label>Display name<input value={displayName} onChange={e => setDisplayName(e.target.value)} /></label><div className="public-toggle"><div><strong>Shareable portfolio page</strong><small>Shareable export includes only activities marked public; private entries are omitted.</small></div><label className="switch"><input type="checkbox" checked={publicProfile} onChange={e => setPublicProfile(e.target.checked)} /><span /></label></div><span className="micro-note">The private export contains all entries. Enable the shareable portfolio to export only entries you marked public. Review any file before sharing.</span></section><div className="profile-summary"><span><strong>{activities.reduce((sum, a) => sum + (a.hours || 0), 0)}</strong><small>participant-recorded hours</small></span><span><strong>{activities.filter(a => a.status === 'Organisation-verified').length}</strong><small>organisation-verified entries</small></span><span><strong>{activities.filter(a => a.public).length}</strong><small>marked public by you</small></span><span><strong>{new Set(activities.map(a => a.organisation)).size}</strong><small>organisations represented</small></span></div><div className="section-title"><div><h2>My activities</h2><p>Self-reported records are not independent evidence.</p></div></div><div className="profile-activities">{activities.map(activity => <article className="profile-activity" key={activity.id}><div className="activity-date"><strong>{activity.date}</strong><small>{activity.location}</small></div><div className="profile-activity-main"><h3>{activity.name}</h3><span>{activity.organisation} · {activity.role}{activity.hours ? ` · ${activity.hours} hours, participant-reported` : ''}</span><p>{activity.description}</p>{activity.skills.length > 0 && <div className="skill-chips">{activity.skills.map(skill => <span key={skill}>{skill}</span>)}</div>}<div className="verify-row"><StatusTag status={activity.type === 'Volunteer' && activity.status === 'Self-reported' ? 'Attendance self-reported' : activity.status} />{activity.verifiedBy && <span>{activity.verifiedBy} · simulated workflow</span>}</div></div><div className="activity-controls"><label className="public-check"><input type="checkbox" checked={activity.public} onChange={() => togglePublic(activity.id)} /> Public</label>{activity.status !== 'Organisation-verified' && <button className="text-button" disabled={role !== 'Operator'} title={role !== 'Operator' ? 'Switch to the Operator role to simulate a review.' : undefined} onClick={() => verify(activity)}>{activity.status === 'Self-reported' ? 'Simulate organiser review' : 'Simulate organisation review'} <ArrowRight size={13} /></button>}{role !== 'Operator' && activity.status !== 'Organisation-verified' && <small className="review-role-note">Operator role required for simulated review</small>}</div></article>)}{!activities.length && <Empty>Completed volunteer and donation records will appear here.</Empty>}</div><div className="verification-note"><ShieldCheck size={17} /><span>Verification workflow is simulated. In production, only authorised event organisers and organisation representatives should verify attendance and contributions. No certificate, hours or endorsement is fabricated.</span></div></>}
  </>
}

function Points() {
  const [search, setSearch] = useState('')
  const shown = collectionPoints.filter(p => p.area.toLowerCase().includes(search.toLowerCase()) || p.materials.join(' ').toLowerCase().includes(search.toLowerCase()))
  return <>
    <PageHeader eyebrow="Neighbourhood access" title="Collection points" description="Browse proposed handoff areas by neighbourhood. Locations and schedules are illustrative." action={<span className="outline-pill">8 areas represented</span>} />
    <div className="points-notice"><Info size={18} /><div><strong>Illustrative service areas only</strong><p>These are Harare neighbourhoods from the brief, not a directory of verified or operating collection centres. Confirm the location, hours and acceptance before taking materials anywhere.</p></div></div>
    <div className="directory-tools"><div className="market-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suburb or accepted material" aria-label="Search collection service areas" /></div><span className="small-label">No fixed drop-off address is published</span></div>
    <div className="points-grid">{shown.map(point => <article className="point-card" key={point.id}><div className="point-heading"><span className="point-symbol"><MapMarkerIcon /></span><span className="status-tag amber">Proposed coordination</span></div><span className="overline">{point.id} · Harare</span><h3>{point.area}</h3><div className="point-detail"><small>Materials to explore</small><div className="material-chips">{point.materials.map(m => <span key={m}>{m}</span>)}</div></div><div className="point-detail"><small>Service concept</small><strong>{point.service}</strong></div><div className="point-detail"><small>Hours</small><strong>{point.hours}</strong></div><div className="point-footer"><span>Illustrative demonstration data</span><span className="status-dot-label"><i />Not confirmed operational</span></div></article>)}</div>
    <div className="footnote"><ShieldCheck size={15} /><span>No physical site is claimed to operate unless its service, access and opening hours have been confirmed by the responsible organisation.</span></div>
  </>
}

function Operations() {
  const [bins, setBins] = useState(binsSeed)
  const [refreshedAt, setRefreshedAt] = useState('Sample snapshot · 22 Nov 2026')
  const route = useMemo(() => [...bins].sort((a, b) => (b.fill * 0.7 + b.rate * 1.5) - (a.fill * 0.7 + a.rate * 1.5)), [bins])
  const refresh = () => { setBins(current => current.map((bin, i) => ({ ...bin, fill: Math.max(0, Math.min(100, bin.fill + ([3, -4, 2, 0, 5][i] || 1))) }))); setRefreshedAt(`Simulated refresh · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`) }
  const parts = [{ name: 'Steel body, lifting frame, lid and corrosion protection', low: 2800, high: 4000 }, { name: 'Concrete vault, reinforcement and waterproofing', low: 1100, high: 1600 }, { name: 'Excavation, drainage and reinstatement', low: 700, high: 1200 }, { name: 'Fill-level sensor and communications allowance', low: 250, high: 600 }, { name: 'Transport, installation and testing', low: 400, high: 700 }]
  const low = Math.round(parts.reduce((sum, p) => sum + p.low, 0) * 1.15)
  const high = Math.round(parts.reduce((sum, p) => sum + p.high, 0) * 1.15)
  const statusCls = (status: string) => status === 'Full' ? 'full' : status === 'Near full' ? 'approaching' : status === 'Maintenance required' ? 'maintenance' : status === 'Filling' ? 'filling' : 'normal'
  return <>
    <PageHeader eyebrow="Service operations" title="Smart bins & operations" description="Compare simulated fill levels and see a sample route priority." action={<button className="button button-secondary" onClick={refresh}><Recycle size={15} /> Simulate sensor refresh</button>} />
    <div className="simulation-bar"><span className="sim-dot" /><div><strong>Simulated sensor data · no connected bins</strong><small>{refreshedAt} · readings are seeded demonstration values</small></div><Info size={16} /></div>
    <section className="ops-panel panel">
      <SectionTitle title="Container status" detail="Fill gauges and route suggestions use simulated readings." />
      <div className="bin-table-wrap" role="region" aria-label="Simulated container levels and route details" tabIndex={0}>
        <table className="bin-table"><thead><tr><th>Container</th><th>Area</th><th>Waste type</th><th>Fill</th><th>Predicted collection</th><th>Last collection</th><th>Status</th></tr></thead><tbody>{bins.map(bin => <tr key={bin.id}>
          <td data-label="Container"><strong>{bin.id}</strong><small>3,000 L concept</small></td>
          <td data-label="Area">{bin.location}</td>
          <td data-label="Waste type">{bin.waste}</td>
          <td data-label="Fill level"><div className="fill-cell"><strong>{bin.fill}%</strong><span className="mini-progress" role="progressbar" aria-label={`${bin.id} simulated fill level`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={bin.fill} aria-valuetext={`${bin.fill}% full`}><i className={statusCls(bin.status)} style={{ width: `${bin.fill}%` }} /></span></div></td>
          <td data-label="Predicted collection">{bin.fill >= 90 ? 'Prioritise next route' : bin.fill >= 65 ? 'Plan within 1–2 days' : 'Monitor trend'}<small>{bin.rate}% / day simulated</small></td>
          <td data-label="Last collection">{bin.last}</td>
          <td data-label="Status"><span className={`bin-status ${statusCls(bin.status)}`}><i />{bin.status}</span></td>
        </tr>)}</tbody></table>
      </div>
    </section>
    <div className="ops-lower"><section className="panel route-panel"><SectionTitle title="Suggested route order" detail="Priority combines current fill and simulated fill rate." /><div className="route-list">{route.map((bin, i) => <div className="route-row" key={bin.id}><span className="route-number">{i + 1}</span><div><strong>{bin.id} · {bin.location}</strong><small>{bin.fill}% full · {bin.rate}% per day · {bin.waste}</small></div><span className={`bin-status ${statusCls(bin.status)}`}>{bin.status}</span></div>)}</div><div className="route-method"><Info size={14} />Demonstration score: 70% fill level + 1.5× daily fill rate. A live route must also consider travel time, vehicle capacity, safety and service commitments.</div></section>
      <section className="panel estimator"><span className="overline">Planning model · preliminary</span><h2>3,000 L underground bin</h2><p>Installed cost range calculated from the initial planning assumptions.</p><div className="estimate-total"><span>Indicative installed cost</span><strong>US${low.toLocaleString()}–${high.toLocaleString()}</strong><small>Includes 15% contingency</small></div><div className="estimate-lines">{parts.map(p => <div key={p.name}><span>{p.name}</span><strong>${p.low.toLocaleString()}–${p.high.toLocaleString()}</strong></div>)}<div className="estimate-contingency"><span>Contingency</span><strong>15%</strong></div></div><div className="estimate-caveat">Preliminary estimate only · not a supplier quotation. Excludes specialised collection vehicles, software operating costs and ongoing maintenance.</div></section></div>
    <section className="recovered-materials"><div><span className="overline">Circular infrastructure</span><h2>Use recovered materials where specifications allow</h2><p>Design for repair, loading and corrosion requirements first; then qualify recycled content for suitable components.</p></div><div className="recovered-list"><span><CheckCircle2 size={15} />Certified recycled-content steel where specifications allow</span><span><CheckCircle2 size={15} />Inspected recovered steel for suitable non-critical parts</span><span><CheckCircle2 size={15} />Recycled HDPE panels and liners where appropriate</span><span><CheckCircle2 size={15} />Recycled tyre rubber protective bumpers</span><span><CheckCircle2 size={15} />Suitable recycled glass aggregate for non-structural use</span></div><div className="critical-warning"><ShieldCheck size={15} />Never use unverified scrap steel for lifting hooks or load-bearing structures.</div></section>
    <Source tag="Technology benchmark">GAD Netherlands approach · route decisions consider fill percentage and filling speed; these readings and this route are simulated.</Source>
  </>
}

function Partners() {
  const orgLinks: Record<string, string> = Object.fromEntries(organisations.map(o => [o.name, o.website]))
  return <>
    <PageHeader eyebrow="Ecosystem map" title="Partners & stakeholders" description="Explore possible roles. Every listing is prospective or referential; none are confirmed." action={<span className="outline-pill"><span className="status-dot-label"><i />0 confirmed partners</span></span>} />
    <div className="partner-integrity"><ShieldCheck size={18} /><div><strong>All relationships are prospective or referential</strong><p>No organisation shown here is presented as a confirmed partner. Formal engagement and permission are required before adding operational claims or contact details.</p></div></div>
    <div className="partner-groups">{partnerGroups.map((group, index) => <section className="partner-group panel" key={group.category}><div className="partner-group-header"><span className="partner-index">{String(index + 1).padStart(2, '0')}</span><div><h2>{group.category}</h2><p>{group.relation}</p></div><span className="status-tag neutral">Potential / reference</span></div><div className="partner-chips">{group.names.map(name => <div className="partner-chip" key={name}><span className="partner-mini-icon"><Package size={15} /></span><span><strong>{name}</strong><small>{orgLinks[name] ? 'Community organisation · source link in directory' : group.relation}</small></span>{orgLinks[name] && <a href={orgLinks[name]} target="_blank" rel="noreferrer" aria-label={`Open ${name} official website`}><ArrowUpRight size={14} /></a>}</div>)}</div></section>)}</div>
    <div className="partners-footer"><Info size={16} /><span>Organisation category describes a possible role or published case study, not due diligence, registration validation, a contract, endorsement or current availability. Charity donation details are linked in Community & giving.</span></div>
  </>
}

function Impact({ requests, listings, books, activities, campaigns }: { requests: Request[]; listings: Listing[]; books: Book[]; activities: Activity[]; campaigns: Campaign[] }) {
  const completed = requests.filter(r => r.status === 'Completed')
  const collectionCompletionRate = requests.length ? Math.round(completed.length / requests.length * 100) : 0
  const measurements = completed.map(r => normalizeMeasurement(r.quantityValue, r.quantityUnit, r.quantity))
  const hasWeight = measurements.some(item => measurementToKilograms(item) !== null && item.value !== null && item.value > 0)
  const quantityKg = totalKilograms(measurements)
  const nonWeightSummary = (['bags', 'containers', 'items'] as const).map(unit => ({ unit, count: measurements.filter(item => item.unit === unit).length, total: measurements.reduce((sum, item) => sum + (item.unit === unit ? item.value ?? 0 : 0), 0) })).filter(item => item.count > 0)
  const unparsedQuantityCount = measurements.filter(item => !item.unit && item.raw).length
  const selfReported = activities.filter(a => a.status === 'Self-reported')
  const verified = activities.filter(a => a.status === 'Organisation-verified')
  const confirmed = activities.filter(a => a.status === 'Organiser-confirmed')
  const hours = activities.reduce((sum, a) => sum + (a.hours || 0), 0)
  const donationCount = activities.filter(a => a.type === 'Donation').length
  const bookExchanges = activities.filter(a => a.type === 'Book exchange').length
  const verifiedProjects = activities.filter(a => a.type === 'Volunteer' && a.status === 'Organisation-verified').length
  const campDone = campaigns.filter(c => c.status === 'Completed').length
  return <>
    <PageHeader eyebrow="Measurement & unit economics" title="Impact & economics" description="Track browser demo records separately from research and planning estimates." action={<span className="outline-pill"><Info size={14} /> Demo records only</span>} />
    <section className="impact-banner"><div><span className="overline">Local coordination results</span><h2>Measure what the workflow actually records.</h2><p>Values below come from this browser’s demo records. Missing operational measurements remain “not recorded” instead of being estimated.</p></div><div className="impact-legend"><span><i className="legend-record" />Recorded demo workflow</span><span><i className="legend-self" />Participant-reported</span><span><i className="legend-verified" />Simulated confirmation</span></div></section>
    <section className="benchmark-flow panel"><div className="benchmark-flow-head"><div><span className="overline">2021 research benchmark</span><h2>From waste generated to controlled management</h2><p>Bars use the same published daily generation figure as their reference.</p></div><Source href={research[0].href} tag="Official research · 2021">UN-Habitat Harare assessment</Source></div><div className="benchmark-bars">{research.slice(0, 3).map((item, index) => { const amount = Number(item.value); const generated = Number(research[0].value); const percent = generated ? Math.round(amount / generated * 100) : 0; return <div className="benchmark-bar-row" key={item.label}><div><strong>{item.label}</strong><span>{item.value} tonnes/day · {percent}% of generated</span></div><div className="benchmark-track" role="img" aria-label={`${item.label}: ${item.value} tonnes per day, ${percent} percent of generated municipal waste`}><span className={`benchmark-fill fill-${index}`} style={{ width: `${percent}%` }} /></div></div> })}</div><small className="benchmark-caveat">Published measures are historical city research; percentages are derived from the reported values and rounded. This chart is not live performance.</small></section>
    <div className="impact-subhead"><span>COLLECTION & MATERIALS</span><small>Local workflow records · not city totals</small></div><div className="impact-grid"><ImpactCard label="Material weight completed" value={hasWeight ? `${quantityKg.toLocaleString('en', { maximumFractionDigits: 3 })} kg` : 'Not recorded'} detail={`${completed.length} completed demo collection tasks. Only grams, kilograms and tonnes count toward weight.`} kind="Recorded demo" /><ImpactCard label="Material recovered" value="Not recorded" detail="No quality or destination confirmation captured" kind="Needs operational data" /><ImpactCard label="Material reused" value={String(activities.filter(a => /reuse|repair|book exchange/i.test(a.name)).length)} detail="Recorded reuse or repair activity entries" kind="Activity record" /><ImpactCard label="Organic waste composted" value="Not recorded" detail="No weighed compost output entered" kind="Needs operational data" /><ImpactCard label="Books exchanged" value={`${bookExchanges} participant-reported`} detail={`${books.length} books listed · completed handovers are not independently confirmed`} kind="Self-reported handover" /><ImpactCard label="Tyres recovered" value="Not recorded" detail="No tyre recovery weigh-in workflow yet" kind="Needs operational data" /><ImpactCard label="Collection jobs created" value={String(requests.length)} detail="Local requests submitted; not all are accepted or complete" kind="Recorded demo" /><ImpactCard label="Collection completion rate" value={collectionCompletionRate + "%"} detail={completed.length + " of " + requests.length + " requests marked complete in this browser"} kind="Recorded demo" /><ImpactCard label="Collector income" value="Not recorded" detail="No payment or current price data is collected" kind="Not monetised" /><ImpactCard label="Marketplace trades" value="0 recorded" detail={`${listings.length} active offers · interest is not a completed transaction`} kind="Recorded demo" /></div>
    {(nonWeightSummary.length > 0 || unparsedQuantityCount > 0) && <section className="nonweight-note" aria-label="Non-weight measurements"><strong>Other recorded quantities stay separate from kilograms</strong>{nonWeightSummary.map(item => <span key={item.unit}>{item.total} {item.unit}</span>)}{unparsedQuantityCount > 0 && <span>{unparsedQuantityCount} older quantity value(s) kept as text because the unit is unclear</span>}</section>}
    <div className="impact-subhead"><span>COMMUNITY & PARTICIPATION</span><small>Personal history and simulated review workflow</small></div><div className="impact-grid community-impact"><ImpactCard label="Volunteer hours" value={`${hours} h`} detail="Participant-entered hours across saved activity records" kind="Self-reported / reviewed" /><ImpactCard label="Donations recorded" value={String(donationCount)} detail="User-entered completed contributions; recipient receipt may be unconfirmed" kind="Self-reported" /><ImpactCard label="Organiser-confirmed activities" value={String(confirmed.length)} detail="Simulated event-organiser review" kind="Simulated verification" /><ImpactCard label="Organisation-verified activities" value={String(verified.length)} detail="Simulated organisation-representative workflow" kind="Simulated verification" /><ImpactCard label="Verified community projects" value={String(verifiedProjects)} detail="Volunteer activities in simulated organisation-verified state" kind="Simulated verification" /><ImpactCard label="Campaigns completed" value={String(campDone)} detail={`${campaigns.filter(c => c.status === 'Active').length} active group drives`} kind="Self-reported progress" /><ImpactCard label="Organisations supported" value={String(new Set(activities.map(a => a.organisation)).size)} detail="Organisations named in activity records" kind="Activity record" /></div>
    <section className="verification-breakdown"><div><span className="verification-dot self" />Self-reported <strong>{selfReported.length}</strong><small>Entered by the participant; not independently checked.</small></div><div><span className="verification-dot organiser" />Organiser-confirmed <strong>{confirmed.length}</strong><small>Simulated event-organiser review for this demo.</small></div><div><span className="verification-dot org" />Organisation-verified <strong>{verified.length}</strong><small>Simulated organisation representative review.</small></div></section>
    <section className="research-benchmarks"><SectionTitle title="Harare research benchmarks" detail="Baseline data stays separate from local product activity and reporting periods." /><div className="research-grid">{research.map(item => <div className="research-cell" key={item.label}><span className="overline">{item.period}</span><strong>{item.value}<small> {item.unit}</small></strong><span>{item.label}</span><Source href={item.href} tag={item.type}>{item.source}</Source></div>)}</div><div className="masterplan-note"><div><span className="overline">Separate estimate · 2024</span><strong>0.54 kg/person/day · 798 tonnes/day</strong><span>City of Harare estimate in the Master Plan published in 2025. Do not blend with the 2021 per-capita assessment.</span><Source href="https://www.hararecity.co.zw/resources/download/388" tag="City estimate · 2024">City of Harare Master Plan</Source></div></div></section>
    <section className="economics-section"><div><span className="overline">Potential earned revenue</span><h2>Contracts and services could fund coordination.</h2><p>These are business model hypotheses, not current income or committed contracts.</p></div><div className="revenue-list"><Revenue title="Municipal & business collection contracts" /><Revenue title="Producer packaging-recovery contracts" /><Revenue title="Marketplace commission and industrial material exchange" /><Revenue title="Waste audits and environmental reporting" /><Revenue title="Compost sales" /><Revenue title="Infrastructure management and maintenance" /></div><div className="economics-guardrail"><ShieldCheck size={17} /><span>Donations and volunteer time are not commercial revenue. Do not charge organisations or vulnerable recipients to receive donations; do not assume households pay for basic access.</span></div></section>
  </>
}
function Revenue({ title }: { title: string }) { return <div className="revenue-row"><span><ArrowRight size={15} /></span><strong>{title}</strong><small>Potential</small></div> }

export default App


