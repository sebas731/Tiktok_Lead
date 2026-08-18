import { prisma } from '@/lib/prisma'
import { WebhookLead } from './types'

export async function WebhookLeads(lead_id:string): Promise<void> {

    const Campanias = Object.freeze({
        T4:       { id: '3e4e5da9-f4dd-46b8-a6fa-bc34f504c2d3', slug: 'c1' },
        T3:       { id: 'camp_1092', slug: 's2' },
        T6:       { id: 'camp_1092', slug: 's6' },
        T1:       { id: 'camp_1092', slug: 's3' },
    });

    const lead = await prisma.lead.findUnique({
        where: {id:lead_id},
        select: { client_number:true ,campaignId:true, campaign:{ select: {name:true} }}
    })

    if (!lead) return

    const payload: WebhookLead = {
        celular : lead.client_number,
        campaignId : lead.campaignId,
        campaignName : lead.campaign?.name,
        origen : 'Tiktok',

    };

    const campanignEntrie = Object.values(Campanias).find(
        (c) => c.id === lead.campaignId
    );
    
    if (!campanignEntrie)return;

    const url = `${process.env.WEBHOOK_URL}/${campanignEntrie?.slug}/ads`
    const res = await fetch (url,{

        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Token': process.env.WEBHOOK_TOKEN! },
        body: JSON.stringify(payload), 

    })

    console.log(res.status)

};
    
