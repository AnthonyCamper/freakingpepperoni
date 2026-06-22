import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItem = 'font-headline-sm text-headline-sm uppercase text-on-surface hover:text-primary hover:bg-surface-container transition-colors px-2 py-1'
const mobileItem = 'font-headline-md text-headline-md uppercase text-on-surface px-2 py-3 border-b-2 border-on-background/15 flex items-center min-h-[44px] active:bg-surface-container'

export default function TopNav() {
  const { session, isEditor, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close the drawer on navigation
  useEffect(() => { setOpen(false) }, [location])

  // Lock body scroll while the full-screen drawer is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <header className="w-full bg-surface border-b-2 border-on-background sticky top-0 z-sticky pt-safe">
      <div className="flex justify-between items-center w-full px-safe py-3 md:py-4 max-w-[1200px] mx-auto gap-3">
        <Link to="/" className="font-display-lg-mobile text-lg sm:text-2xl md:text-display-lg-mobile font-black text-primary tracking-tighter uppercase whitespace-nowrap">
          FREAKING PEPPERONI
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-gutter">
          <NavLink to="/browse" className={navItem}>ARCHIVE</NavLink>
          <NavLink to="/browse?c=mains" className={navItem}>MAINS</NavLink>
          <NavLink to="/browse?c=pasta-italian" className={navItem}>PASTA</NavLink>
          <NavLink to="/browse?c=desserts" className={navItem}>DESSERTS</NavLink>
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <Link to="/browse" className="tap brutal-btn bg-surface border-2 border-on-background flex items-center justify-center p-2 transition-all group" aria-label="Search">
            <span className="material-symbols-outlined text-on-background group-hover:text-primary">search</span>
          </Link>

          {/* Desktop auth actions */}
          {session && isEditor ? (
            <>
              <Link to="/add" className="brutal-btn hidden md:inline-block bg-surface border-2 border-on-background px-4 py-2 font-label-caps text-label-caps uppercase">+ ADD</Link>
              <button onClick={() => signOut()} className="hidden md:inline-block font-label-caps text-label-caps uppercase text-on-surface hover:text-primary">LOGOUT</button>
            </>
          ) : (
            <Link to="/login" className="brutal-btn hidden md:inline-block bg-primary-container text-on-primary-container border-2 border-on-background px-6 py-2 font-label-caps text-label-caps uppercase transition-all">LOGIN</Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="tap md:hidden brutal-btn bg-surface border-2 border-on-background flex items-center justify-center p-2 transition-all"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <span className="material-symbols-outlined text-on-background">{open ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden fixed inset-x-0 top-0 z-modal bg-background border-b-4 border-on-background pt-safe animate-[fadeIn_.15s_ease-out] flex flex-col min-h-screen"
        >
          <div className="flex justify-between items-center px-safe py-3 border-b-2 border-on-background">
            <span className="font-display-lg-mobile text-lg font-black text-primary tracking-tighter uppercase">FREAKING PEPPERONI</span>
            <button onClick={() => setOpen(false)} className="tap brutal-btn bg-surface border-2 border-on-background flex items-center justify-center p-2" aria-label="Close menu">
              <span className="material-symbols-outlined text-on-background">close</span>
            </button>
          </div>

          <nav className="flex flex-col px-safe py-stack-md gap-1">
            <NavLink to="/browse" className={mobileItem}>ARCHIVE</NavLink>
            <NavLink to="/browse?c=mains" className={mobileItem}>MAINS</NavLink>
            <NavLink to="/browse?c=pasta-italian" className={mobileItem}>PASTA</NavLink>
            <NavLink to="/browse?c=desserts" className={mobileItem}>DESSERTS</NavLink>
          </nav>

          <div className="mt-auto px-safe pb-safe pt-stack-md flex flex-col gap-3">
            {session && isEditor ? (
              <>
                <Link to="/add" className="brutal-btn bg-surface border-2 border-on-background px-4 py-3 min-h-[44px] flex items-center justify-center font-label-caps text-label-caps uppercase">+ ADD RECIPE</Link>
                <button onClick={() => { setOpen(false); signOut() }} className="brutal-btn bg-surface border-2 border-on-background px-4 py-3 min-h-[44px] flex items-center justify-center font-label-caps text-label-caps uppercase">LOGOUT</button>
              </>
            ) : (
              <Link to="/login" className="brutal-btn bg-primary-container text-on-primary-container border-2 border-on-background px-6 py-3 min-h-[44px] flex items-center justify-center font-label-caps text-label-caps uppercase">LOGIN</Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
