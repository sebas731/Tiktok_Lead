'use client'

import { useState, type ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { SedeProvider, useSede } from '@/components/layout/SedeContext'
import type { Role } from '@/lib/types'

type Sede = { sede_id: string; code: string; name: string }
type Props = { role: Role; name: string; sedes: Sede[]; children: ReactNode }

function Shell({ role, name, sedes, children }: Props) {
  const { activeSede, setActiveSede } = useSede()
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="flex min-h-screen bg-bg text-text">
      <Sidebar role={role} name={name} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      {/* Backdrop del drawer en móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          name={name}
          role={role}
          sedes={sedes}
          activeSede={activeSede}
          onChangeSede={setActiveSede}
          onOpenMenu={() => setMobileOpen(true)}
        />
        <main className="animate-soft-in flex-1 px-3 pb-8 pt-4 sm:px-6 sm:pt-6">{children}</main>
      </div>
    </div>
  )
}

export function DashboardShell(props: Props) {
  return (
    <SedeProvider>
      <Shell {...props} />
    </SedeProvider>
  )
}
