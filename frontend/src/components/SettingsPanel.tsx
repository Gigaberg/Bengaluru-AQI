'use client';
import { useRouter } from 'next/navigation';
import { X, LogIn, Bell, RefreshCw, Info, ChevronRight, Settings2, Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-md transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-obsidian border-t border-carbon rounded-t-3xl shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-carbon" />
        </div>

        <div className="px-6 pb-10 pt-4 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-mono text-eink tracking-tight flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              CONFIGURATION
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded bg-graphite text-steel hover:text-eink transition-colors btn-press"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <section>
            <h3 className="text-xs font-mono text-steel uppercase tracking-widest mb-3 border-b border-carbon pb-2">
              Account
            </h3>
            <button
              onClick={() => { onClose(); router.push('/login'); }}
              className="w-full flex items-center justify-between p-4 bg-graphite border border-carbon rounded hover:bg-tungsten transition-colors btn-press"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded bg-obsidian border border-carbon flex items-center justify-center">
                  <LogIn className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-left">
                  <div className="font-mono font-medium text-eink text-sm">AUTHENTICATE</div>
                  <div className="text-xs text-steel">Access secure dashboard</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-steel" />
            </button>
          </section>

          <section>
            <h3 className="text-xs font-mono text-steel uppercase tracking-widest mb-3 border-b border-carbon pb-2">
              Appearance
            </h3>
            <div className="bg-graphite dark:bg-graphite border border-carbon rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-mono font-medium text-eink dark:text-eink">THEME MODE</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ThemeButton
                  active={theme === 'light'}
                  onClick={() => setTheme('light')}
                  icon={<Sun className="h-4 w-4" />}
                  label="Light"
                />
                <ThemeButton
                  active={theme === 'dark'}
                  onClick={() => setTheme('dark')}
                  icon={<Moon className="h-4 w-4" />}
                  label="Dark"
                />
                <ThemeButton
                  active={theme === 'system'}
                  onClick={() => setTheme('system')}
                  icon={<Monitor className="h-4 w-4" />}
                  label="System"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-mono text-steel uppercase tracking-widest mb-3 border-b border-carbon pb-2">
              Telemetry Preferences
            </h3>
            <div className="bg-graphite border border-carbon rounded divide-y divide-carbon">
              <Toggle
                icon={<Bell className="h-4 w-4 text-blue-400" />}
                label="AQI ALERTS"
                description="Push notifications on hazardous shift"
                value={notifications}
                onChange={setNotifications}
              />
              <Toggle
                icon={<RefreshCw className="h-4 w-4 text-emerald-400" />}
                label="AUTO-SYNC"
                description="Poll sensors every 300s"
                value={autoRefresh}
                onChange={setAutoRefresh}
              />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-mono text-steel uppercase tracking-widest mb-3 border-b border-carbon pb-2">
              System Info
            </h3>
            <button
              onClick={() => { onClose(); router.push('/about'); }}
              className="w-full flex items-center justify-between p-4 bg-graphite border border-carbon rounded hover:bg-tungsten transition-colors btn-press"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded bg-obsidian border border-carbon flex items-center justify-center">
                  <Info className="h-5 w-5 text-steel" />
                </div>
                <div className="text-left">
                  <div className="font-mono font-medium text-eink text-sm">SYSTEM_ABOUT</div>
                  <div className="text-xs font-numeric text-steel">Build: v0.1.0-alpha</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-steel" />
            </button>
          </section>
        </div>
      </div>
    </>
  );
}

function Toggle({
  icon, label, description, value, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded bg-obsidian border border-carbon flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="font-mono font-medium text-eink text-sm">{label}</div>
          <div className="text-xs text-steel">{description}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors duration-300 btn-press border',
          value ? 'bg-emerald-500/20 border-emerald-500' : 'bg-obsidian border-carbon'
        )}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={cn(
            'absolute top-0.5 left-1 w-4 h-4 rounded-full shadow-sm transition-transform duration-300',
            value ? 'translate-x-6 bg-emerald-400' : 'translate-x-0 bg-steel'
          )}
        />
      </button>
    </div>
  );
}

function ThemeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 btn-press',
        active
          ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
          : 'bg-obsidian dark:bg-obsidian border-2 border-carbon text-steel hover:border-steel hover:text-eink'
      )}
      aria-pressed={active}
    >
      <div className={cn('transition-colors', active && 'text-emerald-400')}>
        {icon}
      </div>
      <span className="text-xs font-mono font-medium">{label}</span>
    </button>
  );
}
