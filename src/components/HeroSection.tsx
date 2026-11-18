import React, { useEffect, useState } from 'react';
import { ArrowRight, Moon, ShieldCheck, Sun, Ticket, UserCheck, UserPlus } from 'lucide-react';
import { AuthUser } from '../types/portal';
import { HeroThreeCanvas } from './HeroThreeCanvas';
import { OfficialLogosStrip } from './OfficialLogos';
import { AuthModalTab } from './PortalAuthModal';

interface HeroSectionProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onRegisterCodestorm: () => void;
  onOpenMyPasses: () => void;
  registeredCount: number;
  authUser: AuthUser | null;
  onOpenAuthTab: (tab: AuthModalTab) => void;
  onOpenWorkspace: () => void;
  liveStats: {
    totalMembers: number;
    totalHeads: number;
    totalEvents: number;
    totalRegistrations: number;
  };
}

interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

const TARGET_DATE_MS = new Date('2026-11-22T09:00:00+05:30').getTime();

function computeCountdown(): CountdownParts {
  const diff = Math.max(0, TARGET_DATE_MS - Date.now());
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  theme,
  onToggleTheme,
  onRegisterCodestorm,
  onOpenMyPasses,
  registeredCount,
  authUser,
  onOpenAuthTab,
  onOpenWorkspace,
  liveStats,
}) => {
  const [countdown, setCountdown] = useState<CountdownParts>(() => computeCountdown());

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown(computeCountdown());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const kpiRows = [
    { label: 'Active Club Members', value: String(liveStats.totalMembers) },
    { label: 'Designated Heads & Leads', value: String(liveStats.totalHeads) },
    { label: 'Club Workshops & Events', value: String(liveStats.totalEvents) },
    { label: 'Event Registrations', value: String(liveStats.totalRegistrations) },
  ];

  return (
    <section
      id="home"
      className="border-b border-slate-200/80 bg-slate-50 pt-5 pb-14 sm:pt-7 sm:pb-20 dark:border-slate-800/80 dark:bg-[#090D16]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Operational Utility Strip (Separate Admin & Member Auth + Theme Switch) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="text-slate-900 dark:text-slate-100">GDG on Campus – RIT Hassan</span>
            <span aria-hidden="true">·</span>
            <span>Dept. of Computer Science &amp; Engineering</span>
            <span aria-hidden="true">·</span>
            <span>Rajeev Institute of Technology</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {authUser ? (
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600/30 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-950/60 dark:text-blue-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {authUser.role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>
                  {authUser.role === 'admin'
                    ? `${authUser.designation}: ${authUser.name}`
                    : `Member: ${authUser.name}`}
                </span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuthTab('admin')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span>Admin Login (HOD / Principal)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuthTab('member')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Member Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuthTab('join')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                  <span>Join Club</span>
                </button>
              </>
            )}

            {registeredCount > 0 && (
              <button
                type="button"
                onClick={onOpenMyPasses}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span className="tabular-nums">My Passes ({registeredCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tri-Emblem Flanking Showcase: Huge Club Logo Centered + College (Left) & CSE Dept (Right) */}
        <div className="mb-8">
          <OfficialLogosStrip prominent />
        </div>

        {/* 2-Column Split Hero with Interactive 3D Three.js Centerpiece */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-1">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-3">
                Department of Computer Science &amp; Engineering · Official Student Club
              </p>

              <h1
                className="font-display font-bold tracking-tight text-slate-950 dark:text-white leading-[1.08] max-w-xl"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
              >
                Think. Create. Innovate. Build the Future.
              </h1>

              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
                The official developer community of the Computer Science &amp; Engineering
                Department at Rajeev Institute of Technology, Hassan. Together through GDG on Campus
                – RIT Hassan, students run weekly study jams, ship department open-source tools, and
                host CODESTORM 2026.
              </p>

              {/* Live Club Flagship Event Countdown Strip */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Next Flagship Club Event · CODESTORM 2026
                  </span>
                  <span className="font-mono tabular-nums">Nov 22, 2026 · 09:00 IST</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { value: countdown.days, label: 'Days' },
                    { value: countdown.hours, label: 'Hours' },
                    { value: countdown.minutes, label: 'Mins' },
                    { value: countdown.seconds, label: 'Secs' },
                  ].map((unit) => (
                    <div
                      key={unit.label}
                      className="rounded-lg bg-slate-50 py-2 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800"
                    >
                      <p className="font-mono text-xl sm:text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
                        {unit.value}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{unit.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onRegisterCodestorm}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              >
                <span>Register for CODESTORM 2026</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <a
                href="#events"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Explore Schedule
              </a>
            </div>
          </div>

          {/* Right Interactive Three.js 3D Viewport */}
          <div className="lg:col-span-6">
            <HeroThreeCanvas />
          </div>
        </div>

        {/* 4-Column Live Tabular KPI Row */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-slate-200/80 dark:border-slate-800/80">
          {kpiRows.map((metric) => (
            <div key={metric.label} className="py-1">
              <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {metric.value}
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
