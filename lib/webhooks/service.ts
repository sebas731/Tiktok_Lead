import { prisma } from '@/lib/prisma'
import { WebhookLead } from './types'

export async function WebhookLeads(lead_id?:string,number?:string,campaign?:string): Promise<void> {

    const Campanias = Object.freeze({
        T4:       { id: '3e4e5da9-f4dd-46b8-a6fa-bc34f504c2d3', slug: 'c1' },
        T3:       { id: 'camp_1092', slug: 's2' },
        T6:       { id: 'camp_1092', slug: 's6' },
        T1:       { id: 'camp_1092', slug: 's3' },
    });

    const links_Thor = Object.freeze({
        S1: "s1",
        S2: "s2",
        S3: "s3",
        S4: "s4",
        S5: "s5",
        S6: "s6",
        S7: "s2",
        C1: "s2",
        C2: "c2",
    })


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

/**
 * Envía un lead al Thor de Jesús con datos DIRECTOS (no necesita que el lead
 * exista en la BD; sirve para el modo ESTRICTO). Arma la URL con el slug de la
 * campaña destino. Devuelve el status HTTP, o null si falló. Nunca lanza.
 */
export async function sendLeadToThor(
  celular: string,
  campaignId: string,
  campaignName: string | null,
  slug: string,
): Promise<number | null> {
  try {
    const payload: WebhookLead = {
      celular,
      campaignId,
      campaignName: campaignName ?? undefined,
      origen: 'Tiktok',
    }
    const res = await fetch(`${process.env.WEBHOOK_URL}/${slug}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Token': process.env.WEBHOOK_TOKEN! },
      body: JSON.stringify(payload),
    })
    return res.status
  } catch {
    return null
  }
}

