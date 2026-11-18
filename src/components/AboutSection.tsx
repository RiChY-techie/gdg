import React from 'react';
import { CAMPUS_IMAGE, HERO_IMAGE, LEADERSHIP_TEAM } from '../data/clubData';
import { ResilientImage } from './ResilientImage';

export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="border-b border-slate-200/80 bg-white py-16 sm:py-24 dark:border-slate-800/80 dark:bg-[#0D1320]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Narrative Column */}
          <div className="lg:col-span-7">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              About GDG on Campus – RIT Hassan &amp; CSE Department
            </p>
            <h2
              className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              Where Computer Science students at RIT Hassan build, mentor, and ship together.
            </h2>

            <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl">
              Hosted by the Department of Computer Science &amp; Engineering at Rajeev Institute of
              Technology, Hassan, GDG on Campus – RIT Hassan is the department&apos;s student-led
              developer club. Guided by CSE faculty advisors and student coordinators, members turn
              classroom concepts into open-source campus software, weekly technical study jams, and
              collaborative hackathons.
            </p>

            {/* Vision, Mission, Objectives without card-in-card nesting */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-slate-200 pt-8 dark:border-slate-800">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  01. Club Vision
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Cultivate a peer-driven engineering culture within the CSE Department at RIT Hassan
                  where every club member graduates with real production software, cloud fluency,
                  and open-source confidence.
                </p>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  02. Club Mission
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Organize weekly CSE peer code reviews, Google Cloud and Web/AI study jams,
                  mentorship clinics, and annual departmental hackathons like CODESTORM 2026.
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-800">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                03. How the Club &amp; CSE Department Collaborate
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                <li>
                  Connect 1st-year through 7th-semester CSE students into mentored domain squads
                  (Web &amp; Cloud, AI &amp; ML, Systems &amp; IoT, and Algorithms).
                </li>
                <li>
                  Build and maintain open-source department utilities inside CSE Innovation Labs with
                  faculty and HOD oversight.
                </li>
                <li>
                  Prepare club members for internships, VTU project exhibitions, and regional
                  developer summits.
                </li>
              </ul>
            </div>

            {/* Secondary Lab Collaboration Photo */}
            <figure className="mt-8">
              <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                <ResilientImage
                  src={HERO_IMAGE}
                  alt="CSE club members collaborating on software prototypes in the RIT Hassan lab"
                  className="w-full h-full object-cover"
                  fallbackTitle="CSE Innovation Lab Collaboration"
                />
              </div>
              <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Fig. 1 — GDG on Campus – RIT Hassan weekly peer debugging inside the CSE Innovation Lab.
              </figcaption>
            </figure>
          </div>

          {/* Right Media & Leadership Column */}
          <div className="lg:col-span-5 space-y-8">
            <figure>
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                <ResilientImage
                  src={CAMPUS_IMAGE}
                  alt="Academic block courtyard at Rajeev Institute of Technology, Hassan"
                  className="w-full h-full object-cover"
                  fallbackTitle="Rajeev Institute of Technology Campus"
                />
              </div>
              <figcaption className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                Fig. 2 — Rajeev Institute of Technology, Hassan — home of the CSE Department &amp; GDG on Campus chapter.
              </figcaption>
            </figure>

            {/* Committee & Coordinator Directory */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/60">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Club &amp; Department Leadership
              </h3>
              <dl className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                {LEADERSHIP_TEAM.map((member) => (
                  <div key={member.name} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {member.name}
                      </dt>
                      <dd className="text-xs font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap">
                        {member.role}
                      </dd>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {member.affiliation}
                    </p>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
