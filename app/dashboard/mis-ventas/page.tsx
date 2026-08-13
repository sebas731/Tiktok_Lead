import { Suspense } from 'react'
import { MisVentasView } from '@/components/sales/MisVentasView'

export default function MisVentasPage() {
  return (
    <Suspense fallback={null}>
      <MisVentasView />
    </Suspense>
  )
}
