import { getSession } from '@/lib/auth/session'
import { ConfigView } from '@/components/settings/ConfigView'
import type { Role } from '@/lib/types'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) return null
  return <ConfigView role={session.role as Role} />
}
