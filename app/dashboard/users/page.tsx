import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { UsersView } from '@/components/users/UsersView'
import type { Role } from '@/lib/types'

export default async function UsersPage() {
  const session = await getSession()
  if (!session) return null
  // Solo ADMIN gestiona usuarios; SUPERVISOR usa la asignación de leads.
  if ((session.role as Role) !== 'ADMIN') redirect('/dashboard')
  return <UsersView />
}
