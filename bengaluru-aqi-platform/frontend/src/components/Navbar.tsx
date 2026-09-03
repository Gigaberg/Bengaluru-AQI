'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu, X,
  LayoutDashboard, MapPin, TrendingUp,
  Zap, SlidersHorizontal, BarChart2,
  Lightbulb, Building2, Info, LogIn, Settings,
  ChevronRight, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsPanel } from '@/components/SettingsPanel';

const navItems = [
  { name: 'Dashboard',   href: '/',                  icon: LayoutDashboard },
  { name: 'Stations',    href: '/stations',           icon: MapPin },
  { name: 'Historical',  href: '/historical',         icon: TrendingUp },
  { name: 'Predict',     href: '/predict',            icon: Zap },
  { name: 'Simulator',   href: '/simulator',          icon: SlidersHorizontal },
  { name: 'Performance', href: '/model-performance',  icon: BarChart2 },
  { name: 'Suggestions', href: '/recommendations',    icon: Lightbulb },
  { name: 'Govt Action', href: '/govt-action',        icon: Building2 },
  { name: 'About',       href: '/about',              icon: Info },
];

const tabItems = [
  { name: 'Home',      href: '/',           icon: LayoutDashboard },
  { name: 'Stations',  href: '/stations',   icon: MapPin },
  { name: 'Predict',   href: '/predict',    icon: Zap },
  { name: 'History',   href: '/historical', icon: TrendingUp },
];


export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const navScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const checkOverflow = useCallback(() => {
    const el = navScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    checkOverflow();
    const el = navScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkOverflow, { passive: true });
    window.addEventListener('resize', checkOverflow);
    return () => {
      el.removeEventListener('scroll', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [checkOverflow]);

  function scrollNavRight() {
    navScrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' });
  }

  function scrollNavLeft() {
    navScrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' });
  }

  return (
    <>
      <nav
        className={cn(
          'sticky top-0 z-50 bg-obsidian/80 dark:bg-obsidian/80 light:bg-white/80 backdrop-blur-xl border-b border-carbon dark:border-carbon light:border-[#d1d1d6] transition-all duration-300',
          scrolled && 'shadow-[0_4px_30px_rgba(0,0,0,0.5)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] light:shadow-[0_4px_30px_rgba(0,0,0,0.1)]'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Brand */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-3 mr-4">
              <Image
                src="/icon.jpg"
                alt="Bengaluru AQI"
                width={32}
                height={32}
                className="rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] grayscale opacity-80"
                priority
              />
              <span className="font-mono text-lg text-eink dark:text-eink light:text-[#1d1d1f] font-bold tracking-tight hidden lg:block">
                BLR_AQI_SYS
              </span>
            </Link>

            {/* Desktop nav pills + scroll arrows */}
            <div className="hidden sm:flex sm:items-center flex-1 min-w-0 relative">
              {/* Left arrow */}
              {canScrollLeft && (
                <button
                  onClick={scrollNavLeft}
                  aria-label="Scroll navigation left"
                  className="flex-shrink-0 flex items-center justify-center w-7 h-7 mr-1 rounded text-steel hover:text-eink hover:bg-graphite transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              <div
                ref={navScrollRef}
                className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 pr-2"
              >
                {navItems.map(({ name, href, icon: Icon }) => (
                  <Link
                    key={name}
                    href={href}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all duration-200 whitespace-nowrap',
                      pathname === href
                        ? 'bg-eink dark:bg-eink light:bg-[#1d1d1f] text-obsidian dark:text-obsidian light:text-white font-semibold'
                        : 'text-steel dark:text-steel light:text-[#6e6e73] hover:text-eink dark:hover:text-eink light:hover:text-[#1d1d1f] hover:bg-graphite dark:hover:bg-graphite light:hover:bg-[#f5f5f7]'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    {name}
                  </Link>
                ))}
              </div>

              {/* Scroll-right arrow — only visible when content is clipped */}
              {canScrollRight && (
                <button
                  onClick={scrollNavRight}
                  aria-label="Scroll navigation right"
                  className="flex-shrink-0 flex items-center justify-center w-7 h-7 ml-1 rounded text-steel hover:text-eink hover:bg-graphite transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Right: settings + sign in */}
            <div className="hidden sm:flex items-center gap-2 ml-4 shrink-0">
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded text-steel dark:text-steel light:text-[#6e6e73] hover:text-eink dark:hover:text-eink light:hover:text-[#1d1d1f] hover:bg-graphite dark:hover:bg-graphite light:hover:bg-[#f5f5f7] transition-colors btn-press"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded text-obsidian dark:text-obsidian light:text-white bg-eink dark:bg-eink light:bg-[#1d1d1f] hover:bg-white dark:hover:bg-white light:hover:bg-black transition-colors btn-press"
              >
                <LogIn className="h-4 w-4" />
                AUTH
              </Link>
            </div>

            {/* Mobile hamburger */}
            <div className="flex items-center sm:hidden gap-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded text-steel dark:text-steel light:text-[#6e6e73] hover:text-eink dark:hover:text-eink light:hover:text-[#1d1d1f] hover:bg-graphite dark:hover:bg-graphite light:hover:bg-[#f5f5f7] transition-colors"
              >
                <span className="sr-only">Open menu</span>
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isOpen && (
          <div className="sm:hidden bg-obsidian/95 dark:bg-obsidian/95 light:bg-white/95 backdrop-blur-xl border-b border-carbon dark:border-carbon light:border-[#d1d1d6] absolute w-full shadow-2xl">
            <div className="pt-2 pb-4 space-y-1">
              {navItems.map(({ name, href, icon: Icon }) => (
                <Link
                  key={name}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors',
                    pathname === href
                      ? 'bg-graphite dark:bg-graphite light:bg-[#f5f5f7] text-eink dark:text-eink light:text-[#1d1d1f] border-l-2 border-eink dark:border-eink light:border-[#1d1d1f]'
                      : 'text-steel dark:text-steel light:text-[#6e6e73] hover:bg-graphite dark:hover:bg-graphite light:hover:bg-[#f5f5f7] hover:text-eink dark:hover:text-eink light:hover:text-[#1d1d1f] border-l-2 border-transparent'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {name}
                </Link>
              ))}
              <div className="px-5 pt-4 flex gap-3">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded font-semibold text-obsidian dark:text-obsidian light:text-white bg-eink dark:bg-eink light:bg-[#1d1d1f] transition-colors btn-press"
                >
                  <LogIn className="h-4 w-4" />
                  AUTH
                </Link>
                <button
                  onClick={() => { setIsOpen(false); setSettingsOpen(true); }}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded font-semibold text-eink dark:text-eink light:text-[#1d1d1f] bg-graphite dark:bg-graphite light:bg-[#f5f5f7] border border-carbon dark:border-carbon light:border-[#d1d1d6] transition-colors btn-press"
                >
                  <Settings className="h-4 w-4" />
                  CONF
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-obsidian/90 dark:bg-obsidian/90 light:bg-white/90 backdrop-blur-xl border-t border-carbon dark:border-carbon light:border-[#d1d1d6]">
        <div className="flex justify-around items-center h-16 px-2">
          {tabItems.map(({ name, href, icon: Icon }) => (
            <Link
              key={name}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 min-w-[52px] transition-all duration-200',
                pathname === href ? 'text-eink dark:text-eink light:text-[#1d1d1f]' : 'text-steel dark:text-steel light:text-[#6e6e73]'
              )}
            >
              <div className={cn(
                'p-1.5 rounded transition-all duration-200',
                pathname === href ? 'bg-graphite dark:bg-graphite light:bg-[#f5f5f7]' : ''
              )}>
                <Icon className={cn('h-5 w-5', pathname === href ? 'stroke-[2]' : 'stroke-[1.5]')} />
              </div>
              <span className={cn('text-[10px] font-mono leading-none tracking-tight', pathname === href ? 'font-bold' : 'font-medium')}>
                {name.toUpperCase()}
              </span>
            </Link>
          ))}

          <button
            onClick={() => setSettingsOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 min-w-[52px] text-steel dark:text-steel light:text-[#6e6e73] hover:text-eink dark:hover:text-eink light:hover:text-[#1d1d1f] transition-all duration-200"
          >
            <div className="p-1.5 rounded">
              <Settings className="h-5 w-5 stroke-[1.5]" />
            </div>
            <span className="text-[10px] font-mono font-medium leading-none tracking-tight">CONF</span>
          </button>
        </div>
      </nav>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
