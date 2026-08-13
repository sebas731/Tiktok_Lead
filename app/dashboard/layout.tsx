import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getCurrentUser } from '@/lib/users/service'
import { listSedes } from '@/lib/sedes/service'
import { DashboardShell } from '@/components/layout/DashboardShell'
import type { Role } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const role = session.role as Role
  const auth = { userId: session.userId, role }
  const [user, sedes] = await Promise.all([getCurrentUser(auth), listSedes(auth)])

  return (
    <DashboardShell
      role={role}
      name={user?.name ?? session.userId}
      sedes={sedes.map((s) => ({ sede_id: s.sede_id, code: s.code, name: s.name }))}
    >
      {children}
    </DashboardShell>
  )
}
