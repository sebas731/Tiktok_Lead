import { getSession } from '@/lib/auth/session'
import { CampaignLeadsView } from '@/components/leads/CampaignLeadsView'
import type { Role } from '@/lib/types'

export default async function CampaignLeadsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null
  const { id } = await params
  return <CampaignLeadsView campaignId={id} role={session.role as Role} />
}
