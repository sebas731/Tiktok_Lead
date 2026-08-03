import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

// Prefijos de rutas que exigen sesión válida.
const PROTECTED_PREFIXES = ['/dashboard']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
}

// En Next 16 la convención `middleware` se renombró a `proxy` (mismo Edge Runtime).
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('session')?.value
  // verifyToken usa `jose`, compatible con Edge Runtime.
  const session = token ? await verifyToken(token) : null

  // Un usuario ya logueado no debería ver /login → al dashboard.
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Ruta protegida sin sesión válida → al login (recordando a dónde iba).
  if (isProtected(pathname) && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Solo corre en las rutas relevantes (no en assets ni en /api).
  matcher: ['/dashboard/:path*', '/login'],
}
