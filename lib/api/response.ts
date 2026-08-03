import { NextResponse } from 'next/server'
import { Prisma } from '@/lib/generated/prisma/client'

/** Error HTTP genérico con código de estado. */
export class HttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

function hasStatus(e: unknown): e is { status: number; message: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    typeof (e as { status: unknown }).status === 'number'
  )
}

/**
 * Convierte cualquier error lanzado en una respuesta JSON coherente.
 * Reconoce AuthError/HttpError (por su `status`) y los errores conocidos de
 * Prisma (únicos duplicados, relación inexistente).
 */
export function errorResponse(e: unknown): NextResponse {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un registro con ese valor único' },
        { status: 409 }
      )
    }
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }
  }
  if (hasStatus(e)) {
    return NextResponse.json({ error: e.message }, { status: e.status })
  }
  console.error('Error no controlado en API:', e)
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
}

/** Lee y parsea el body JSON, lanzando 400 si es inválido. */
export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw new HttpError(400, 'Body JSON inválido')
  }
}

/** Valida que un valor sea string no vacío. */
export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, `Campo requerido: ${field}`)
  }
  return value.trim()
}

/** Valida que un valor pertenezca a un enum (objeto de valores). */
export function requireEnum<T extends Record<string, string>>(
  value: unknown,
  enumObj: T,
  field: string
): T[keyof T] {
  if (typeof value !== 'string' || !Object.values(enumObj).includes(value)) {
    throw new HttpError(400, `Valor inválido para ${field}`)
  }
  return value as T[keyof T]
}
