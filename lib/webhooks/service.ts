import { prisma } from '@/lib/prisma'
import { WebhookLead } from './types'

export async function WebhookLeads(): Promise<void> {

    const lead = await prisma.lead.findUnique({
        where: {id:"703c6b67-0565-4c9e-a43b-5b9a2366b1a3"},
        select: { client_number:true ,campaignId:true, campaign:{ select: {name:true} }}
    })

    if (!lead) return

    const payload: WebhookLead = {
        number : lead.client_number,
        campaignId : lead.campaignId,
        campaignName : lead.campaign?.name,
        origin : 'Tiktok',

    }
    
    const res = await fetch (process.env.WEBHOOK_URL!,{

        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Token': process.env.WEBHOOK_TOKEN! },
        body: JSON.stringify(payload), 

    })

    console.log(res.status)
    
}