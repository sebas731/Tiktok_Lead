import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ProcessedLeadsView } from '@/components/reports/ProcessedLeadsView'
import type { Role } from '@/lib/types'

export default async function ReportesPage() {
  const session = await getSession()
  if (!session) return null
  const role = session.role as Role
  if (role !== 'ADMIN' && role !== 'SUPERVISOR') redirect('/dashboard')
  return <ProcessedLeadsView />
}
