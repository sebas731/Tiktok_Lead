import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { AssignCampaignUsers } from '@/components/campaigns/AssignCampaignUsers'
import type { Role } from '@/lib/types'

export default async function AssignCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null
  if ((session.role as Role) !== 'ADMIN') redirect('/dashboard')
  const { id } = await params
  return <AssignCampaignUsers campaignId={id} />
}
