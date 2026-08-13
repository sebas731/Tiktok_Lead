import { getSession } from '@/lib/auth/session'
import { VentasAdminView } from '@/components/sales/VentasAdminView'
import type { Role } from '@/lib/types'

export default async function VentasPage() {
  const session = await getSession()
  if (!session) return null
  return <VentasAdminView role={session.role as Role} />
}
