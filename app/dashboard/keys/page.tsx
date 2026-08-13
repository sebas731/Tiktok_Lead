import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { KeysView } from '@/components/keys/KeysView'
import type { Role } from '@/lib/types'

export default async function KeysPage() {
  const session = await getSession()
  if (!session) return null
  if ((session.role as Role) !== 'ADMIN') redirect('/dashboard')
  return <KeysView />
}
