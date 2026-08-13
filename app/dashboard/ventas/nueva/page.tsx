'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { SaleForm } from '@/components/sales/SaleForm'

function NuevaVenta() {
  const router = useRouter()
  const params = useSearchParams()
  const leadId = params.get('leadId') ?? undefined
  const campaignId = params.get('campaignId') ?? undefined
  return (
    <div>
      <PageHeader title="Nueva venta" description="Registra una venta. La sede se asigna según tu usuario." />
      <div className="rounded-3xl border border-border/70 bg-surface p-5 shadow-soft">
        <SaleForm
          leadId={leadId}
          campaignId={campaignId}
          onSaved={() => router.push('/dashboard/ventas')}
          onCancel={() => router.push('/dashboard/ventas')}
        />
      </div>
    </div>
  )
}

export default function NuevaVentaPage() {
  return (
    <Suspense fallback={null}>
      <NuevaVenta />
    </Suspense>
  )
}
