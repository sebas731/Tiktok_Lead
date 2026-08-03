import { PrismaClient } from '@/lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Reutiliza una sola instancia de PrismaClient en desarrollo.
// Next.js hace hot-reload de los módulos en cada cambio; sin este singleton
// se crearía un PrismaClient nuevo (con su propio pool de conexiones) en cada
// recarga, agotando las conexiones de la base de datos.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('Falta la variable de entorno DATABASE_URL')
}

// Prisma 7 requiere declarar explícitamente cómo se conecta el cliente.
// Usamos el driver adapter de PostgreSQL (pg) para una conexión directa a la
// base local, en vez de `accelerateUrl` (que era para Prisma Postgres).
const adapter = new PrismaPg({ connectionString: databaseUrl })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

// En producción NO guardamos la instancia en el global (cada proceso/lambda
// crea la suya una sola vez); solo cacheamos en dev para sobrevivir al hot reload.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
