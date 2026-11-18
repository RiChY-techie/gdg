import React from 'react';
import { ArrowUp } from 'lucide-react';
import { OfficialLogosStrip } from './OfficialLogos';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 py-12 sm:py-16 dark:bg-[#090D16]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <OfficialLogosStrip compact />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-8 border-t border-slate-200 pt-10 dark:border-slate-800">
          <div className="md:col-span-5">
            <p className="font-display text-lg font-bold text-slate-950 dark:text-white">
              GDG on Campus – RIT Hassan · Dept. of CSE
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-sm">
              Think. Create. Innovate. Build the Future. Official student developer club hosted by
              the Department of Computer Science &amp; Engineering at Rajeev Institute of
              Technology, Hassan.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">Navigation</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <a href="#home" className="hover:text-slate-950 dark:hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-slate-950 dark:hover:text-white">
                  About Club
                </a>
              </li>
              <li>
                <a href="#events" className="hover:text-slate-950 dark:hover:text-white">
                  CODESTORM &amp; Events
                </a>
              </li>
              <li>
                <a href="#projects" className="hover:text-slate-950 dark:hover:text-white">
                  Student Projects
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-slate-950 dark:hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
              Official Links &amp; Community
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <a
                  href="https://rithassan.ac.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-950 dark:hover:text-white"
                >
                  Rajeev Institute of Technology, Hassan
                </a>
              </li>
              <li>
                <a
                  href="https://gdg.community.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-950 dark:hover:text-white"
                >
                  GDG on Campus Community Portal
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-950 dark:hover:text-white"
                >
                  Club GitHub Organization
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <p>
            © 2026 GDG on Campus – RIT Hassan · Dept. of Computer Science &amp; Engineering,
            Rajeev Institute of Technology, Hassan.
          </p>

          <a
            href="#home"
            className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
};
