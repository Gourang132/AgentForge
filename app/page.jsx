'use client'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'

const PLANS = [
  { name: 'Starter', price: '₹0', period: 'Forever free', color: 'border-white/10',
    features: ['3 AI products', 'Groq free tier', 'RAG 10MB', 'Marketplace listing', 'Subdomain'],
    cta: 'Start Free', href: '/sign-up', outline: true },
  { name: 'Builder', price: '₹3,999', period: '/month · cancel anytime', color: 'border-c1', hot: true,
    features: ['Unlimited products', 'All AI models', 'RAG 10GB', 'Custom domain', 'Built-in payments', 'Multi-agent real', 'Analytics dashboard'],
    cta: 'Get Builder', href: '/sign-up', outline: false },
  { name: 'Enterprise', price: '₹24,999', period: '/month', color: 'border-white/10',
    features: ['Everything in Builder', 'White label', 'Unlimited RAG', 'Priority models', 'Reseller program', 'Dedicated support'],
    cta: 'Contact Sales', href: 'mailto:hello@agentforge.io', outline: true }
]

const FEATURES = [
  { icon: '🧠', label: 'RAG Engine', title: 'Real Knowledge Base', desc: 'Upload PDFs, CSVs, URLs. AI answers from your actual data — not hallucinations. Vector search powered by Supabase pgvector.' },
  { icon: '⚡', label: 'Groq Powered', title: '800 Tokens/Second', desc: 'World\'s fastest AI inference. Llama 3.3 70B free tier. 10x faster than OpenAI. Real-time streaming responses.' },
  { icon: '🤖', label: 'Multi-Agent', title: 'Real Agent Pipelines', desc: 'Sequential agent orchestration. Planner → Researcher → Writer → Critic. Each agent builds on the last.' },
  { icon: '💳', label: 'Payments', title: 'Razorpay + Stripe', desc: 'Built-in subscriptions. INR + global cards. You keep 80% of every payment. Automated billing and receipts.' },
  { icon: '🌍', label: 'Deploy', title: 'Global CDN', desc: '50ms latency worldwide. Auto-scaling on Vercel. 99.99% uptime. Custom domain + SSL included.' },
  { icon: '🏷️', label: 'White Label', title: 'Your Brand', desc: 'Custom domain, your logo, your colors. Users never see AgentForge. Fully white-labeled product experience.' }
]

const STATS = [
  { n: '12k+', l: 'Products Built' }, { n: '$2.4M', l: 'Creator Revenue' },
  { n: '180+', l: 'Countries' }, { n: '4.2M', l: 'API Calls/Day' }
]

export default function Landing() {
  const { isSignedIn } = useUser()

  return (
    <main className="min-h-screen bg-bg">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center overflow-hidden">
        {/* Sphere decorations */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full animate-sph1"
            style={{background:'radial-gradient(circle at 32% 28%,rgba(0,245,255,.12),rgba(0,245,255,.04) 40%,transparent 65%)',boxShadow:'0 0 80px rgba(0,245,255,.06),inset 0 0 100px rgba(0,245,255,.04)'}} />
          <div className="absolute -bottom-20 -left-20 w-[380px] h-[380px] rounded-full animate-sph2"
            style={{background:'radial-gradient(circle at 60% 65%,rgba(255,0,170,.1),transparent 65%)',boxShadow:'0 0 60px rgba(255,0,170,.05)'}} />
          <div className="absolute top-1/3 left-[8%] w-[200px] h-[200px] rounded-full animate-float"
            style={{background:'radial-gradient(circle,rgba(123,47,255,.08),transparent 65%)',animationDelay:'-2s'}} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[.025]" style={{backgroundImage:'linear-gradient(#00f5ff 1px,transparent 1px),linear-gradient(90deg,#00f5ff 1px,transparent 1px)',backgroundSize:'72px 72px',maskImage:'radial-gradient(ellipse 120% 70% at 50% 0,black,transparent 70%)'}} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-10 animate-rise" style={{animationDelay:'.1s',opacity:0}}>
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-c1" />
            <span className="font-mono text-[11px] tracking-[4px] text-c1 uppercase">The AI Operating System for Builders</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-c1" />
          </div>

          <h1 className="font-orb font-black leading-[.87] tracking-tight mb-6 animate-rise" style={{fontSize:'clamp(52px,10vw,130px)',animationDelay:'.2s',opacity:0}}>
            <span className="block grad-c1">BUILD AI</span>
            <span className="block grad-c2">PRODUCTS</span>
          </h1>

          <p className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed mb-10 animate-rise" style={{animationDelay:'.32s',opacity:0}}>
            The platform where <span className="text-c1 font-semibold">anyone</span> builds, deploys, and monetizes AI.{' '}
            <span className="text-c1 font-semibold">No infrastructure.</span> Powered by Groq — the world's fastest AI. Live in minutes.
          </p>

          <div className="flex gap-3 justify-center flex-wrap mb-16 animate-rise" style={{animationDelay:'.44s',opacity:0}}>
            <Link href={isSignedIn ? '/dashboard' : '/sign-up'}
              className="px-10 py-4 font-orb text-[11px] font-bold tracking-[2px] uppercase rounded-sm text-black transition-all hover:-translate-y-1 hover:shadow-2xl"
              style={{background:'linear-gradient(135deg,#00f5ff,#ff00aa)',boxShadow:'0 0 30px rgba(0,245,255,.3)'}}>
              Start Building Free →
            </Link>
            <Link href="#features"
              className="px-10 py-4 font-orb text-[11px] font-bold tracking-[2px] uppercase rounded-sm border border-c1 text-c1 transition-all hover:bg-c1 hover:text-black">
              See How It Works ↓
            </Link>
          </div>

          <div className="grid grid-cols-4 border border-white/[.06] rounded divide-x divide-white/[.06] animate-rise" style={{animationDelay:'.55s',opacity:0}}>
            {STATS.map(s => (
              <div key={s.l} className="py-6 text-center hover:bg-c1/[.03] transition-colors">
                <div className="font-orb text-3xl font-black grad-c1 mb-1">{s.n}</div>
                <div className="font-mono text-[9px] text-white/30 tracking-[2px] uppercase">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-y border-white/[.04] overflow-hidden bg-white/[.01]">
        <div className="flex animate-march w-max">
          {['Groq Powered','Real RAG Engine','Multi-Agent AI','One-Click Deploy','Built-in Payments','Vector Database','Custom Domains','White Label','Marketplace','Free Forever'].flatMap((t,i) => [
            <span key={i} className="flex items-center gap-3 px-8 py-3 font-mono text-[10px] text-white/25 tracking-[2.5px] uppercase whitespace-nowrap">
              <span className="w-[3px] h-[3px] rounded-full bg-c1 shadow-[0_0_8px_#00f5ff]" />{t}
            </span>
          ])}
          {['Groq Powered','Real RAG Engine','Multi-Agent AI','One-Click Deploy','Built-in Payments','Vector Database','Custom Domains','White Label','Marketplace','Free Forever'].flatMap((t,i) => [
            <span key={'b'+i} className="flex items-center gap-3 px-8 py-3 font-mono text-[10px] text-white/25 tracking-[2.5px] uppercase whitespace-nowrap">
              <span className="w-[3px] h-[3px] rounded-full bg-c1 shadow-[0_0_8px_#00f5ff]" />{t}
            </span>
          ])}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="py-28 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="font-mono text-[10px] tracking-[4px] text-c1 uppercase block mb-3">Features</span>
          <h2 className="font-orb text-5xl font-black tracking-tight grad-c1 mb-3">Everything included.</h2>
          <p className="text-white/30 text-lg">Nothing extra. No hidden fees.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {FEATURES.map(f => (
            <div key={f.label} className="glass rounded-xl p-8 hover:border-c1/20 hover:-translate-y-1 transition-all group">
              <span className="font-mono text-[9px] tracking-[2.5px] text-c1 uppercase block mb-3">{f.label}</span>
              <span className="text-4xl block mb-4">{f.icon}</span>
              <h3 className="font-orb text-lg font-bold mb-3">{f.title}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-28 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="font-mono text-[10px] tracking-[4px] text-c1 uppercase block mb-3">Pricing</span>
          <h2 className="font-orb text-5xl font-black tracking-tight mb-3">Build free.<br />Scale when ready.</h2>
          <p className="text-white/30 text-lg">No infrastructure bills. Groq free tier covers all testing.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 items-center">
          {PLANS.map(p => (
            <div key={p.name} className={`glass rounded-xl p-10 border transition-all ${p.color} ${p.hot ? 'scale-105 shadow-[0_0_80px_rgba(0,245,255,.07)]' : 'hover:-translate-y-1'} relative`}>
              {p.hot && <span className="absolute top-4 right-4 font-mono text-[9px] border border-c1 text-c1 px-2 py-1 rounded-sm tracking-[2px]">POPULAR</span>}
              <div className="font-mono text-[9px] tracking-[3px] text-white/30 uppercase mb-4">{p.name}</div>
              <div className={`font-orb text-5xl font-black tracking-tight mb-1 ${p.hot ? 'grad-c1' : ''}`}>{p.price}</div>
              <div className="font-mono text-[10px] text-white/25 mb-7">{p.period}</div>
              <ul className="space-y-2 mb-8">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/45">
                    <span className="font-mono text-[11px] text-c1">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href={p.href}
                className={`block w-full py-3 text-center font-orb text-[10px] font-bold tracking-[2px] uppercase rounded-sm transition-all ${
                  p.outline ? 'border border-white/15 text-white hover:border-c1 hover:text-c1'
                  : 'text-black hover:-translate-y-px'
                }`}
                style={!p.outline ? {background:'linear-gradient(135deg,#00f5ff,#ff00aa)',boxShadow:'0 4px 20px rgba(0,245,255,.2)'} : {}}>
                {p.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-36 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 80% 70% at 50% 50%,rgba(0,245,255,.06),transparent),radial-gradient(ellipse 60% 50% at 50% 50%,rgba(255,0,170,.04),transparent)'}} />
        <h2 className="font-orb font-black tracking-tight leading-[.9] mb-6 relative" style={{fontSize:'clamp(40px,7vw,100px)'}}>
          <span className="block grad-c1">Your AI product.</span>
          <span className="block grad-c2">Live tonight.</span>
        </h2>
        <p className="text-white/30 text-lg mb-10">Join 2,400+ builders who stopped waiting and started earning.</p>
        <Link href="/sign-up"
          className="inline-block px-12 py-4 font-orb text-[11px] font-bold tracking-[2px] uppercase text-black rounded-sm transition-all hover:-translate-y-1 hover:shadow-2xl"
          style={{background:'linear-gradient(135deg,#00f5ff,#ff00aa)',boxShadow:'0 0 40px rgba(0,245,255,.25)'}}>
          Start Building Free — No Card Needed →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[.04] py-8 px-8 flex items-center justify-between bg-[#04040e]">
        <span className="font-orb text-sm font-black tracking-[2px] grad-all">AGENTFORGE</span>
        <div className="flex gap-6 text-[10px] font-mono text-white/20 tracking-[1px]">
          <Link href="#features" className="hover:text-c1 transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-c1 transition-colors">Pricing</Link>
          <Link href="/dashboard" className="hover:text-c1 transition-colors">Dashboard</Link>
        </div>
        <span className="font-mono text-[10px] text-white/10 tracking-[1px]">© 2026 AgentForge · Powered by Groq ⚡</span>
      </footer>
    </main>
  )
}
