import { useEffect, useState } from 'react'
import {
  Activity, BookOpen, Building2, ChartNoAxesCombined, ChevronUp, HeartHandshake,
  House, MapPin, MoreHorizontal, Recycle, Sprout, Sparkles, Truck,
  type LucideIcon,
} from 'lucide-react'
import { APP_NAME, navigation, type PageId } from '../data'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard: House,
  Truck,
  Recycle,
  Sparkles,
  Sprout,
  BookOpen,
  HeartHandshake,
  MapPin,
  Waves: Activity,
  Building2,
  ChartNoAxesCombined,
}

type Props = { page: PageId; onNavigate: (page: PageId) => void; hasOpenRequests?: boolean }

function NavigationIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? Recycle
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />
}

export function DesktopNavigation({ page, onNavigate, hasOpenRequests = false }: Props) {
  return <aside className="sidebar" aria-label="Main navigation">
    <div className="brand"><div className="brand-mark"><Recycle size={22} aria-hidden="true" /></div><div><strong>{APP_NAME}</strong><span>Harare · resource coordination</span></div></div>
    <div className="offline-indicator"><span className="offline-dot" /> Local demo <span className="offline-divider">·</span> Offline ready</div>
    {(['Workspace', 'Network', 'Evidence'] as const).map(group => <div className="nav-group" key={group}>
      <p className="nav-label">{group}</p>
      {navigation.filter(item => item.group === group).map(item => <button type="button" key={item.id} className={`nav-link ${page === item.id ? 'active' : ''}`} onClick={() => onNavigate(item.id)} aria-current={page === item.id ? 'page' : undefined}>
        <NavigationIcon name={item.icon} size={18} /><span>{item.label}</span>
        {item.id === 'collection' && hasOpenRequests && <i className="nav-dot" aria-label="Requests are waiting for a collector" />}
      </button>)}
    </div>)}
    <div className="sidebar-bottom"><div className="sync-line"><span className="offline-dot" /> Saved on this device</div><small>Prototype · records stay in this browser and are not shared with other users.</small></div>
  </aside>
}

const primaryIds: PageId[] = ['overview', 'collection', 'marketplace', 'community']

export function MobileNavigation({ page, onNavigate }: Props) {
  const [moreOpen, setMoreOpen] = useState(false)
  const primary = navigation.filter(item => primaryIds.includes(item.id))
  const more = navigation.filter(item => !primaryIds.includes(item.id))
  const moreActive = more.some(item => item.id === page)

  useEffect(() => {
    if (!moreOpen) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMoreOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [moreOpen])

  const choose = (id: PageId) => { setMoreOpen(false); onNavigate(id) }

  return <>
    {moreOpen && <>
      <button className="mobile-more-scrim" type="button" aria-label="Close more navigation" onClick={() => setMoreOpen(false)} />
      <section id="mobile-more-menu" className="mobile-more-menu" aria-label="More sections">
        <div className="mobile-more-heading"><h2>More sections</h2><button type="button" className="icon-button" aria-label="Close more sections" onClick={() => setMoreOpen(false)}>×</button></div>
        <div className="mobile-more-grid">{more.map(item => <button type="button" key={item.id} className={`mobile-more-link ${page === item.id ? 'active' : ''}`} aria-current={page === item.id ? 'page' : undefined} onClick={() => choose(item.id)}><NavigationIcon name={item.icon} /><span>{item.label}</span></button>)}</div>
      </section>
    </>}
    <nav className="mobile-bottom-nav" aria-label="Primary navigation">
      {primary.map(item => <button type="button" key={item.id} className={`mobile-nav-item ${page === item.id ? 'active' : ''}`} aria-current={page === item.id ? 'page' : undefined} onClick={() => choose(item.id)}><NavigationIcon name={item.icon} size={19} /><span>{item.id === 'overview' ? 'Home' : item.id === 'collection' ? 'Collect' : item.id === 'marketplace' ? 'Marketplace' : 'Community'}</span></button>)}
      <button type="button" className={`mobile-nav-item ${moreActive || moreOpen ? 'active' : ''}`} aria-expanded={moreOpen} aria-controls={moreOpen ? 'mobile-more-menu' : undefined} onClick={() => setMoreOpen(value => !value)}><span className="more-icon">{moreOpen ? <ChevronUp size={19} aria-hidden="true" /> : <MoreHorizontal size={19} aria-hidden="true" />}</span><span>More</span></button>
    </nav>
  </>
}
