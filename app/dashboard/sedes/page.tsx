import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { SedesView } from '@/components/sedes/SedesView'
import type { Role } from '@/lib/types'

export default async function SedesPage() {
  const session = await getSession()
  if (!session) return null
  if ((session.role as Role) !== 'ADMIN') redirect('/dashboard')
  return <SedesView />
}
