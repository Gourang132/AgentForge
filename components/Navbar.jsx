'use client'
import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'

export default function Navbar() {
  const { isSignedIn } = useUser()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-4 border-b border-white/[.04]" style={{ background: 'rgba(0,0,10,.85)', backdropFilter: 'blur(24px)' }}>
      <Link href="/" className="font-orb text-base font-black tracking-[3px] grad-all">AGENTFORGE</Link>
      <div className="flex items-center gap-6">
        <Link href="/#features" className="font-mono text-[10px] text-white/30 hover:text-c1 tracking-[2px] uppercase transition-colors">Features</Link>
        <Link href="/#pricing" className="font-mono text-[10px] text-white/30 hover:text-c1 tracking-[2px] uppercase transition-colors">Pricing</Link>
        {isSignedIn ? (
          <>
            <Link href="/dashboard" className="font-mono text-[10px] text-white/30 hover:text-c1 tracking-[2px] uppercase transition-colors">Dashboard</Link>
            <UserButton afterSignOutUrl="/" />
          </>
        ) : (
          <>
            <Link href="/sign-in" className="font-mono text-[10px] text-white/30 hover:text-c1 tracking-[2px] uppercase transition-colors">Sign In</Link>
            <Link href="/sign-up" className="font-mono text-[10px] border border-c1 text-c1 px-4 py-2 hover:bg-c1 hover:text-black transition-all tracking-[2px] uppercase">Start Free →</Link>
          </>
        )}
      </div>
    </nav>
  )
}
