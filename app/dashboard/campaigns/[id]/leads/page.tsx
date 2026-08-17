import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { canSeeCampaign } from '@/lib/auth/authorize'
import { CampaignLeadsView } from '@/components/leads/CampaignLeadsView'
import { AsesorCampaignLeads } from '@/components/leads/AsesorCampaignLeads'
import type { Role } from '@/lib/types'

export default async function CampaignLeadsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null
  const role = session.role as Role
  const { id } = await params
  // Bloquea el acceso directo por URL si le quitaron el acceso a la campaña.
  if (!(await canSeeCampaign({ userId: session.userId, role }, id))) redirect('/dashboard/campaigns')
  if (role === 'ASESOR') return <AsesorCampaignLeads campaignId={id} />
  return <CampaignLeadsView campaignId={id} role={role} />
}
