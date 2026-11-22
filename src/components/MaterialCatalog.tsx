import {
  Container, Cpu, Disc3, FileText, GlassWater, Layers, Leaf, Package,
  PanelsTopLeft, Shirt, TreePine, Wrench, type LucideIcon,
} from 'lucide-react'
import { materialCatalog } from '../data'

const icons: Record<string, LucideIcon> = {
  Package, Container, Layers, PanelsTopLeft, GlassWater, FileText,
  Wrench, Leaf, Shirt, Disc3, TreePine, Cpu,
}

export function MaterialCatalog({ selected, onSelect }: { selected: string; onSelect: (filter: string) => void }) {
  return <details className="material-catalog">
    <summary><span>Browse 13 material types</span><small>Choose a material to filter offers</small></summary>
    <div className="material-catalog-grid">{materialCatalog.map(material => {
      const Icon = icons[material.icon] ?? Package
      return <button type="button" key={material.name} className={`material-type-card ${selected === material.filter ? 'selected' : ''}`} aria-pressed={selected === material.filter} onClick={() => onSelect(material.filter)}>
        <span className="material-type-icon"><Icon size={20} aria-hidden="true" /></span>
        <span><strong>{material.name}</strong><small>{material.description}</small></span>
      </button>
    })}</div>
  </details>
}
