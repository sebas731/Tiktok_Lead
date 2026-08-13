'use client'

import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { SedeProvider, useSede } from '@/components/layout/SedeContext'
import type { Role } from '@/lib/types'

type Sede = { sede_id: string; code: string; name: string }
type Props = { role: Role; name: string; sedes: Sede[]; children: ReactNode }

function Shell({ role, name, sedes, children }: Props) {
  const { activeSede, setActiveSede } = useSede()
  return (
    <div className="flex min-h-screen bg-bg text-text">
      <Sidebar role={role} name={name} />
      <div className="flex flex-1 flex-col">
        <TopBar
          name={name}
          role={role}
          sedes={sedes}
          activeSede={activeSede}
          onChangeSede={setActiveSede}
        />
        <main className="animate-soft-in flex-1 px-6 pb-8 pt-6">{children}</main>
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
