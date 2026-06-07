import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata = {
  title: 'AgentForge — Build AI Products',
  description: 'Build, deploy and monetize AI products. Powered by Groq.',
  openGraph: { title: 'AgentForge', description: 'Build AI SaaS products in minutes', type: 'website' }
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
