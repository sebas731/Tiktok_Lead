import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getCurrentUser } from '@/lib/users/service'
import { Sidebar } from '@/components/dashboard/Sidebar'
import type { Role } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const role = session.role as Role
  const user = await getCurrentUser({ userId: session.userId, role })

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar role={role} name={user?.name ?? session.userId} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
