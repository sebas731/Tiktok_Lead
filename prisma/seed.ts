import { PrismaClient } from '@/lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from '../lib/auth/password'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {

  console.log('Iniciando seed...')

  const roles = [
    { name: 'ADMIN', description: 'Control total del sistema' },
    { name: 'SUPERVISOR', description: 'Gestiona campañas asignadas y asigna leads a asesores' },
    { name: 'ASESOR', description: 'Gestiona los leads que le fueron asignados' },
    { name: 'BACK', description: 'Edita registros de ventas ya cerradas' },
  ]

  for (const rol of roles) {
    await prisma.rOL.upsert({
      where: { name: rol.name },
      update: {},
      create: rol,
    })
    console.log(`Rol procesado: ${rol.name}`)
  }
    const adminRol = await prisma.rOL.findUniqueOrThrow({
    where: { name: 'ADMIN' },
  })

  await prisma.user.upsert({
    where : {login: 'admin'},
    update: {},
    create: {
      login: 'admin',
      password: await hashPassword('admin123'),
      email: 'admin@ck2.com',
      name: 'Sebastian',
      first_last_name: 'Mamani',
      second_last_name: 'Guillen',
      document_number: '00000001',
      idRol: adminRol.id_rol,
    },
  })

    console.log('Seed completado. Usuario admin creado (login: admin / clave: admin123)')
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
  