import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/lib/auth/password'
import { signToken } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json()

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Login y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { login },
      include: { rol: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    if (!user.status) {
      return NextResponse.json(
        { error: 'Usuario desactivado' },
        { status: 403 }
      )
    }

    const passwordValido = await comparePassword(password, user.password)

    if (!passwordValido) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const token = await signToken({
      userId: user.user_id,
      role: user.rol.name,
    })

    const response = NextResponse.json({
      user: {
        id: user.user_id,
        name: user.name,
        login: user.login,
        role: user.rol.name,
      },
    })

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}