import { getBranding } from '@/lib/settings/branding'
import { LoginForm } from '@/components/auth/LoginForm'

export default async function LoginPage() {
  const b = await getBranding()

  return (
    <main className="flex min-h-screen">
      {/* Panel lateral (imagen configurable, con fallback degradado CK2) */}
      <div
        className="relative hidden w-1/2 flex-col justify-end overflow-hidden p-10 text-white md:flex"
        style={
          b.sideImageUrl
            ? { backgroundImage: `url(${b.sideImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(155deg, #a61c28 0%, #7c141d 55%, #3d3d3d 100%)' }
        }
      >
        {!b.sideImageUrl && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(600px 340px at 80% 10%, rgba(255,255,255,0.16), transparent 60%)' }}
          />
        )}
        <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold ring-1 ring-white/25 backdrop-blur">
          CK2
        </div>
        <p className="relative z-10 max-w-xs text-lg font-medium opacity-95">{b.subtitle}</p>
      </div>

      {/* Formulario */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="animate-soft-in w-full max-w-sm rounded-3xl border border-border/70 bg-surface/90 p-8 shadow-soft-lg backdrop-blur">
          <div className="mb-6">
            {b.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logoUrl} alt="logo" className="mb-3 h-10 object-contain" />
            ) : (
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-red to-brand-red-dk text-sm font-bold text-white shadow-brand">
                CK2
              </div>
            )}
            <h1 className="text-xl font-semibold text-text">{b.title}</h1>
            <p className="mt-1 text-sm text-text-muted">Ingresa con tus credenciales</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
