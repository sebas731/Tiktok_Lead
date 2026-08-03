import { getSession } from '@/lib/auth/session'
import { getSummary } from '@/lib/dashboard/summary'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import type { Role } from '@/lib/types'

export default async function DashboardHome() {
  const session = await getSession()
  if (!session) return null

  const cards = await getSummary({ userId: session.userId, role: session.role as Role })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Resumen</h1>
      <SummaryCards cards={cards} />
    </div>
  )
}
