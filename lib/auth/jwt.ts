import { SignJWT, jwtVerify } from 'jose'

const secret = process.env.JWT_SECRET


if (!secret) {
  throw new Error('Falta la variable de entorno JWT_SECRET')
}

const encodedSecret = new TextEncoder().encode(secret)

export type SessionPayload = {
  userId: string
  role: string
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(encodedSecret)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret)
    return {
      userId: payload.userId as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

