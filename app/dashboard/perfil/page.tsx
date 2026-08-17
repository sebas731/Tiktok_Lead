import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getCurrentUser } from '@/lib/users/service'
import { MiPerfilView } from '@/components/perfil/MiPerfilView'
import { fullName } from '@/lib/types'
import type { Role } from '@/lib/types'

export default async function PerfilPage() {
  const session = await getSession()
  if (!session) return null
  // Las rachas son solo para asesores; otros roles no tienen perfil de rachas.
  if (session.role !== 'ASESOR') redirect('/dashboard/campaigns')
  const user = await getCurrentUser({ userId: session.userId, role: session.role as Role })
  return <MiPerfilView name={user ? fullName(user) : session.userId} />
}
