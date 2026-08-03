import { getSession } from '@/lib/auth/session'
import { CampaignsView } from '@/components/campaigns/CampaignsView'
import type { Role } from '@/lib/types'

export default async function CampaignsPage() {
  const session = await getSession()
  if (!session) return null
  return <CampaignsView role={session.role as Role} />
}
