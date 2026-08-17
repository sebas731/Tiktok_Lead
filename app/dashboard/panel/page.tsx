import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { PanelView } from '@/components/panel/PanelView'

export default async function PanelPage() {
  const session = await getSession()
  if (!session) return null
  // Panel de control solo para admin y supervisor.
  if (session.role !== 'ADMIN' && session.role !== 'SUPERVISOR') redirect('/dashboard/campaigns')
  return <PanelView />
}
