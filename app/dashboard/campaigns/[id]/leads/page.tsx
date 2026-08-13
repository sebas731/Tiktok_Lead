import { getSession } from '@/lib/auth/session'
import { CampaignLeadsView } from '@/components/leads/CampaignLeadsView'
import { AsesorCampaignLeads } from '@/components/leads/AsesorCampaignLeads'
import type { Role } from '@/lib/types'

export default async function CampaignLeadsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null
  const role = session.role as Role
  const { id } = await params
  if (role === 'ASESOR') return <AsesorCampaignLeads campaignId={id} />
  return <CampaignLeadsView campaignId={id} role={role} />
}
