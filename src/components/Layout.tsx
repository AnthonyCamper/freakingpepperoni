import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-safe py-stack-lg">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
