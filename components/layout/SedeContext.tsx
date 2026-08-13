'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type SedeCtx = { activeSede: string; setActiveSede: (id: string) => void }

const Ctx = createContext<SedeCtx>({ activeSede: '', setActiveSede: () => {} })

export function useSede() {
  return useContext(Ctx)
}

export function SedeProvider({ children }: { children: ReactNode }) {
  const [activeSede, setActiveSede] = useState('')
  return <Ctx.Provider value={{ activeSede, setActiveSede }}>{children}</Ctx.Provider>
}
