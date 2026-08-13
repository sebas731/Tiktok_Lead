import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { BrandingView } from '@/components/settings/BrandingView'
import type { Role } from '@/lib/types'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) return null
  if ((session.role as Role) !== 'ADMIN') redirect('/dashboard')
  return <BrandingView />
}
