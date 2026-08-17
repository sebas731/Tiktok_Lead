import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { MisStatsView } from '@/components/panel/MisStatsView'

export default async function MisStatsPage() {
  const session = await getSession()
  if (!session) return null
  if (session.role !== 'ASESOR') redirect('/dashboard/campaigns')
  return <MisStatsView />
}
