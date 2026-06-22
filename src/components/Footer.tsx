export default function Footer() {
  return (
    <footer className="w-full bg-on-background border-t-4 border-primary mt-16">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-stack-lg gap-gutter max-w-[1200px] mx-auto">
        <div className="font-headline-sm text-headline-sm text-surface uppercase">FREAKING PEPPERONI</div>
        <nav className="flex flex-wrap justify-center gap-4">
          <span className="font-label-mono text-label-mono text-surface-variant opacity-80 uppercase">ASK YOUR AUNTIE</span>
          <span className="font-label-mono text-label-mono text-surface-variant opacity-80 uppercase">TERMS OF THE KITCHEN</span>
        </nav>
        <div className="font-label-mono text-label-mono text-surface-variant opacity-60 text-center md:text-right max-w-[300px]">
          HAND-CODED BY THE FAMILY. NO COOKIES, JUST PEPPERONI.
        </div>
      </div>
    </footer>
  )
}
