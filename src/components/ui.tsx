import type { ReactNode } from 'react'
import { ArrowUpRight, Check, CircleHelp } from 'lucide-react'

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>
}

export function SectionTitle({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="section-title"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action}</div>
}

export function Source({ children, href, tag = 'Research benchmark' }: { children: ReactNode; href?: string; tag?: string }) {
  return <div className="source-line"><span className="source-tag">{tag}</span><span>{children}</span>{href && <a href={href} target="_blank" rel="noreferrer" aria-label="Open source in a new tab"><ArrowUpRight size={14} aria-hidden="true" /></a>}</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty-state"><CircleHelp size={20} aria-hidden="true" /><p>{children}</p></div>
}

export function StatusTag({ status }: { status: string }) {
  const cls = status.toLowerCase().includes('verified') || status === 'Completed' ? 'green' : status.toLowerCase().includes('organiser') || status === 'Assigned' || status === 'Collected' || status === 'Registered' ? 'blue' : status === 'Full' ? 'red' : status === 'Near full' ? 'amber' : 'neutral'
  return <span className={`status-tag ${cls}`}>{status}</span>
}

export function CollectionProgress({ status }: { status: string }) {
  const steps = ['Requested', 'Accepted', 'Collected', 'Completed']
  const current = status === 'Completed' ? 3 : status === 'Collected' ? 2 : status === 'Assigned' ? 1 : 0
  return <ol className="collection-progress" aria-label={`Collection progress: ${steps[current]}`}>
    {steps.map((step, index) => <li key={step} className={`${index <= current ? 'complete' : ''} ${index === current ? 'current' : ''}`} aria-current={index === current ? 'step' : undefined}><span className="progress-node">{index < current ? <Check size={12} aria-hidden="true" /> : index + 1}</span><span>{step}</span></li>)}
  </ol>
}

export function ImpactCard({ label, value, detail, kind }: { label: string; value: string; detail: string; kind: string }) {
  return <article className="impact-card"><span className="impact-card-kind">{kind}</span><strong>{value}</strong><h3>{label}</h3><p>{detail}</p></article>
}
