import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { LimpiezaView } from '@/components/panel/LimpiezaView'

export default async function LimpiezaPage() {
  const session = await getSession()
  if (!session) return null
  // Solo administrador.
  if (session.role !== 'ADMIN') redirect('/dashboard/campaigns')
  return <LimpiezaView />
}
