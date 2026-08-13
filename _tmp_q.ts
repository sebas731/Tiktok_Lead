import { prisma } from '@/lib/prisma'
import { createKey, listKeys, deleteKey, updateKey } from '@/lib/keys/service'
import { createCampaign } from '@/lib/campaigns/service'

async function main() {
  // 1) createKey enmascara
  const k = await createKey({ name: '__TEST KEY__', accessToken: 'abcd1234SECRETtoken9f2a', advertiserId: '7338511714075328513' })
  console.log('createKey ->', JSON.stringify(k))
  console.log('  token enmascarado (esperado ••••••••9f2a):', k.tokenMasked)

  // 2) listKeys no expone token
  const list = await listKeys()
  const row = list.find((x) => x.id === k.id)!
  console.log('listKeys row tiene accessToken?:', 'accessToken' in row, '(esperado false)')
  console.log('  campaignCount:', row.campaignCount)

  // 3) campaña deriva advertiserId de la Key (aunque no lo mandemos)
  const camp = await createCampaign({ source: 'TIKTOK', name: '__TEST CAMP__', tiktokCampaignId: '1873353462783202', keyId: k.id })
  console.log('campaña tiktokAdvertiserId (derivado):', (camp as any).tiktokAdvertiserId, '(esperado 7338511714075328513)')

  // 4) deleteKey bloqueado por campaña dependiente
  try {
    await deleteKey(k.id)
    console.log('ERROR: deleteKey NO bloqueó')
  } catch (e: any) {
    console.log('deleteKey bloqueado OK:', e.message)
  }

  // 5) updateKey: conservar token si no se envía; renovar si se envía
  const upd = await updateKey(k.id, { name: '__TEST KEY 2__' })
  console.log('updateKey sin token -> token sigue:', upd.tokenMasked, '(esperado ••••••••9f2a)')

  // limpieza
  await prisma.campaign.delete({ where: { campaign_id: (camp as any).campaign_id } })
  await deleteKey(k.id)
  console.log('limpiado OK')
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
