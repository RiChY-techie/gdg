import React, { useState } from 'react';
import { BookOpen, Check, Clock, Copy, Layers, Terminal } from 'lucide-react';
import { MENTORSHIP_SLOTS, RESOURCE_VAULT, STUDY_TRACKS } from '../data/clubData';

interface FeaturesSectionProps {
  onJumpToEvents: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onJumpToEvents }) => {
  const [activeTrackId, setActiveTrackId] = useState(STUDY_TRACKS[0].id);
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rit_cse_booked_slots');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [copiedResourceId, setCopiedResourceId] = useState<string | null>(null);

  const activeTrack = STUDY_TRACKS.find((t) => t.id === activeTrackId) || STUDY_TRACKS[0];

  const handleToggleSlot = (slotId: string) => {
    setBookedSlotIds((prev) => {
      const next = prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId];
      try {
        localStorage.setItem('rit_cse_booked_slots', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleCopyChecklist = (resourceId: string, title: string, outline: string[]) => {
    const text = `${title}\n${outline.map((line, i) => `${i + 1}. ${line}`).join('\n')}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedResourceId(resourceId);
    setTimeout(() => {
      setCopiedResourceId((curr) => (curr === resourceId ? null : curr));
    }, 2000);
  };

  return (
    <section
      id="features"
      className="border-b border-slate-200/80 bg-slate-50 py-16 sm:py-24 dark:border-slate-800/80 dark:bg-[#090D16]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
            Club Capabilities &amp; Member Tools
          </p>
          <h2
            className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white"
            style={{ textWrap: 'balance' }}
          >
            Built for active learning, peer code review, and hackathon readiness.
          </h2>
        </div>

        {/* Asymmetric Bento Grid (avoiding cliché symmetrical 3-column icon triad) */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Feature 01 (col-span-7): Interactive Weekly Study Track Explorer */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                  01. Guided Study Track Explorer
                </h3>
                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Switch between semester-aligned CSE engineering tracks led by senior GDG on Campus
                and department leads.
              </p>

              {/* Track Switcher Tabs */}
              <div
                role="tablist"
                aria-label="Study tracks"
                className="mt-5 flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
              >
                {STUDY_TRACKS.map((track) => {
                  const selected = track.id === activeTrack.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveTrackId(track.id)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        selected
                          ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                          : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {track.title.split('&')[0].trim()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {activeTrack.lead}
                  </span>
                  <span>{activeTrack.schedule}</span>
                </div>
                <h4 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {activeTrack.title}
                </h4>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {activeTrack.focus}
                </p>

                <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {activeTrack.modules.map((mod, idx) => (
                    <li key={mod} className="flex items-start gap-2.5">
                      <span className="font-mono text-xs text-blue-700 dark:text-blue-400 mt-1 tabular-nums">
                        0{idx + 1}
                      </span>
                      <span>{mod}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Open to all RIT Hassan CSE semesters
              </span>
              <button
                type="button"
                onClick={onJumpToEvents}
                className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
              >
                Browse upcoming sessions →
              </button>
            </div>
          </div>

          {/* Feature 02 (col-span-5): Peer Mentorship & Code Review Office Hours */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                  02. Peer Code Review Hours
                </h3>
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Book a 20-minute review slot in CSE Lab 204 for debugging, Git help, or hackathon
                architecture feedback.
              </p>

              <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {MENTORSHIP_SLOTS.map((slot) => {
                  const booked = bookedSlotIds.includes(slot.id);
                  return (
                    <div key={slot.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {slot.topic}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          {slot.day} · {slot.time}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Mentor: {slot.mentor}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleSlot(slot.id)}
                        className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                          booked
                            ? 'border border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-900 text-white hover:bg-blue-700 dark:bg-slate-800 dark:hover:bg-blue-600'
                        }`}
                      >
                        {booked ? (
                          <>
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Booked</span>
                          </>
                        ) : (
                          <span>Book Slot</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              {bookedSlotIds.length > 0
                ? `${bookedSlotIds.length} office-hour slot(s) saved to your browser.`
                : 'No account required — click a slot to reserve your bench.'}
            </p>
          </div>

          {/* Feature 03 & 04 (col-span-12): VTU CSE & CODESTORM Resource Vault */}
          <div className="lg:col-span-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                    03. Engineering Resource Vault &amp; CODESTORM Checklists
                  </h3>
                </div>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  Copy structured checklists and VTU CSE lab guides directly into your project notes.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <Terminal className="w-4 h-4" aria-hidden="true" />
                <span>Maintained by GDG on Campus – RIT Hassan</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {RESOURCE_VAULT.map((res) => {
                const isCopied = copiedResourceId === res.id;
                return (
                  <div
                    key={res.id}
                    className="flex flex-col justify-between border-t md:border-t-0 md:border-r last:border-r-0 border-slate-200 pt-4 md:pt-0 md:pr-6 last:pr-0 dark:border-slate-800"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-blue-700 dark:text-blue-400">
                          {res.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{res.format}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{res.updated}</span>
                      </div>

                      <h4 className="mt-2 font-display text-base font-semibold text-slate-950 dark:text-white">
                        {res.title}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {res.description}
                      </p>

                      <ul className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {res.outline.map((point) => (
                          <li key={point}>• {point}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyChecklist(res.id, res.title, res.outline)}
                      className="mt-5 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          <span>Checklist Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Copy Outline</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
