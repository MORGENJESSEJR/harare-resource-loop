import { ArrowRight, Factory, Filter, House, PackageCheck, Recycle, Truck } from 'lucide-react'

const steps = [
  { label: 'Household', icon: House },
  { label: 'Collection', icon: Truck },
  { label: 'Sorting', icon: Filter },
  { label: 'Processing', icon: Factory },
  { label: 'New products', icon: PackageCheck },
  { label: 'Household', icon: Recycle },
]

export function CircularLoop() {
  return <ol className="loop-diagram" aria-label="Household to collection to sorting to processing to new products and back to the household">
    {steps.map((step, index) => {
      const Icon = step.icon
      return <li className="loop-step" key={`${step.label}-${index}`}>
        <span className="loop-icon"><Icon size={21} strokeWidth={1.9} aria-hidden="true" /></span>
        <strong>{step.label}</strong>
        {index < steps.length - 1 && <ArrowRight className="loop-arrow" size={17} aria-hidden="true" />}
      </li>
    })}
  </ol>
}
