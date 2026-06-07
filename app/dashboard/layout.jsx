import Navbar from '@/components/Navbar'
export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="pt-16">{children}</div>
    </div>
  )
}
