import { Link, NavLink } from 'react-router-dom'

const navItem = 'font-headline-sm text-headline-sm uppercase text-on-surface hover:text-primary hover:bg-surface-container transition-colors px-2 py-1'

export default function TopNav() {
  return (
    <header className="w-full bg-surface border-b-2 border-on-background sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-[1200px] mx-auto">
        <Link to="/" className="font-display-lg-mobile text-display-lg-mobile font-black text-primary tracking-tighter uppercase whitespace-nowrap">
          FREAKING PEPPERONI
        </Link>
        <nav className="hidden md:flex items-center gap-gutter">
          <NavLink to="/browse" className={navItem}>ARCHIVE</NavLink>
          <NavLink to="/browse?c=mains" className={navItem}>MAINS</NavLink>
          <NavLink to="/browse?c=pasta-italian" className={navItem}>PASTA</NavLink>
          <NavLink to="/browse?c=desserts" className={navItem}>DESSERTS</NavLink>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/browse" className="brutal-btn bg-surface border-2 border-on-background p-2 transition-all group" aria-label="Search">
            <span className="material-symbols-outlined text-on-background group-hover:text-primary">search</span>
          </Link>
          <Link to="/login" className="brutal-btn hidden md:inline-block bg-primary-container text-on-primary-container border-2 border-on-background px-6 py-2 font-label-caps text-label-caps uppercase transition-all">
            LOGIN
          </Link>
        </div>
      </div>
    </header>
  )
}
