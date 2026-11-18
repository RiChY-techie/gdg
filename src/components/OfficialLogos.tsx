import React from 'react';
import clgLogo from '../assets/logos/Clg-Logo.jpeg';
import deptLogo from '../assets/logos/Dept-Logo.jpeg';
import gdgLogo from '../assets/logos/GDG_CLUB-logo.jpeg';

export interface OfficialLogoItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  subtitle: string;
}

export const OFFICIAL_LOGOS: OfficialLogoItem[] = [
  {
    id: 'rit-college',
    src: clgLogo,
    alt: 'Rajeev Institute of Technology (RIT), Hassan official logo',
    title: 'Rajeev Institute of Technology',
    subtitle: 'Hassan · Host Institution',
  },
  {
    id: 'gdg-campus',
    src: gdgLogo,
    alt: 'GDG on Campus – RIT Hassan official club logo',
    title: 'GDG on Campus – RIT Hassan',
    subtitle: 'Official CSE Student Developer Club',
  },
  {
    id: 'cse-dept',
    src: deptLogo,
    alt: 'Department of Computer Science and Engineering, RIT Hassan official logo',
    title: 'Dept. of Computer Science & Engg.',
    subtitle: 'Host Academic Department',
  },
];

interface OfficialLogosStripProps {
  compact?: boolean;
  prominent?: boolean;
}

export const OfficialLogosStrip: React.FC<OfficialLogosStripProps> = ({
  compact = false,
  prominent = false,
}) => {
  const college = OFFICIAL_LOGOS[0];
  const club = OFFICIAL_LOGOS[1];
  const department = OFFICIAL_LOGOS[2];

  if (compact) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left: College */}
        <div className="md:col-span-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="w-12 h-12 shrink-0 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
            <img src={college.src} alt={college.alt} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {college.title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{college.subtitle}</p>
          </div>
        </div>

        {/* Center: Larger Club Emblem */}
        <div className="md:col-span-6 flex items-center justify-center gap-4 rounded-xl border border-blue-600/25 bg-white p-3.5 shadow-xs dark:border-blue-500/30 dark:bg-slate-900">
          <div className="w-16 h-16 shrink-0 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center overflow-hidden">
            <img src={club.src} alt={club.alt} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm sm:text-base font-bold text-slate-950 dark:text-white leading-snug">
              {club.title}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
              {club.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Department */}
        <div className="md:col-span-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="w-12 h-12 shrink-0 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
            <img src={department.src} alt={department.alt} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {department.title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{department.subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-12 gap-4 sm:gap-5 items-stretch">
      {/* Left Flank: Host College Logo */}
      <div className="col-span-1 md:col-span-3 order-2 md:order-1 flex flex-col items-center justify-center text-center rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/90">
        <div
          className={`flex items-center justify-center rounded-xl bg-white border border-slate-200 p-1.5 overflow-hidden ${
            prominent ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-14 h-14'
          }`}
        >
          <img
            src={college.src}
            alt={college.alt}
            className="w-full h-full object-contain"
            loading="eager"
          />
        </div>
        <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
          {college.title}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          {college.subtitle}
        </p>
      </div>

      {/* Center Focal Showcase: HUGE Club Logo */}
      <div className="col-span-2 md:col-span-6 order-1 md:order-2 flex flex-col sm:flex-row items-center justify-center gap-5 rounded-2xl border border-blue-600/25 bg-white p-5 sm:p-6 shadow-sm dark:border-blue-500/30 dark:bg-slate-900">
        <div className="shrink-0 flex items-center justify-center rounded-2xl bg-white border-2 border-slate-200/90 p-2.5 shadow-xs dark:border-slate-700 w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 overflow-hidden">
          <img
            src={club.src}
            alt={club.alt}
            className="w-full h-full object-contain"
            loading="eager"
          />
        </div>
        <div className="text-center sm:text-left min-w-0">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
            Student Developer Chapter
          </p>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
            {club.title}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-snug">
            Department of Computer Science &amp; Engineering Club
          </p>
          <p className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Peer Coding · Cloud Study Jams · CODESTORM 2026
          </p>
        </div>
      </div>

      {/* Right Flank: Partner CSE Department Logo */}
      <div className="col-span-1 md:col-span-3 order-3 md:order-3 flex flex-col items-center justify-center text-center rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/90">
        <div
          className={`flex items-center justify-center rounded-xl bg-white border border-slate-200 p-1.5 overflow-hidden ${
            prominent ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-14 h-14'
          }`}
        >
          <img
            src={department.src}
            alt={department.alt}
            className="w-full h-full object-contain"
            loading="eager"
          />
        </div>
        <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
          {department.title}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          {department.subtitle}
        </p>
      </div>
    </div>
  );
};
