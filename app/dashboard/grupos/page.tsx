import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { GruposView } from '@/components/grupos/GruposView'
import type { Role } from '@/lib/types'

export default async function GruposPage() {
  const session = await getSession()
  if (!session) return null
  const role = session.role as Role
  if (role !== 'ADMIN' && role !== 'SUPERVISOR') redirect('/dashboard')
  return <GruposView role={role} />
}
