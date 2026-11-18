import React, { useMemo, useState } from 'react';
import { Calendar, Check, ChevronDown, ChevronUp, MapPin, Search, Users } from 'lucide-react';
import { ClubEvent, EventCategory } from '../data/clubData';
import { ResilientImage } from './ResilientImage';

interface EventsSectionProps {
  events: ClubEvent[];
  registeredEventIds: string[];
  onSelectEventForRegistration: (event: ClubEvent) => void;
}

const CATEGORIES: EventCategory[] = ['All', 'Hackathon', 'Workshop', 'Study Jam', 'Tech Talk'];

export const EventsSection: React.FC<EventsSectionProps> = ({
  events,
  registeredEventIds,
  onSelectEventForRegistration,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAgendaId, setExpandedAgendaId] = useState<string | null>('codestorm-2026-nov');

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return events.filter((ev) => {
      const matchesCategory = selectedCategory === 'All' || ev.category === selectedCategory;
      const matchesQuery =
        !query ||
        ev.title.toLowerCase().includes(query) ||
        ev.summary.toLowerCase().includes(query) ||
        ev.venue.toLowerCase().includes(query) ||
        ev.coordinator.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [events, selectedCategory, searchQuery]);

  const featuredEvent = filteredEvents.find((e) => e.featured);
  const secondaryEvents = filteredEvents.filter((e) => !e.featured || e.id !== featuredEvent?.id);

  return (
    <section
      id="events"
      className="border-b border-slate-200/80 bg-slate-50 py-16 sm:py-24 dark:border-slate-800/80 dark:bg-[#090D16]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Club Calendar · GDG on Campus &amp; CSE Dept.
            </p>
            <h2
              className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              Club Study Jams, Workshops &amp; CODESTORM 2026
            </h2>
          </div>

          {/* Search & Category Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events or venues..."
                aria-label="Search events"
                className="w-full sm:w-64 min-h-[42px] rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div
              role="tablist"
              aria-label="Filter events by category"
              className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
            >
              {CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white'
                        : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              No matching events found
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Try clearing your search filter or switching back to all event categories.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Featured CODESTORM 2026 Card */}
        {featuredEvent && (
          <article className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-5 min-h-[240px] bg-slate-100 dark:bg-slate-800">
                <ResilientImage
                  src={featuredEvent.image || ''}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover"
                  fallbackTitle={featuredEvent.title}
                />
              </div>

              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  {/* Zero-pill unboxed metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="text-blue-700 dark:text-blue-400">{featuredEvent.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{featuredEvent.date}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{featuredEvent.time}</span>
                    <span aria-hidden="true">·</span>
                    <span>Coordinator: {featuredEvent.coordinator}</span>
                  </div>

                  <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {featuredEvent.title}
                  </h3>

                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    {featuredEvent.summary}
                  </p>

                  {/* Agenda Disclosure */}
                  <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedAgendaId((prev) =>
                          prev === featuredEvent.id ? null : featuredEvent.id
                        )
                      }
                      aria-expanded={expandedAgendaId === featuredEvent.id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-blue-700 dark:text-slate-200 dark:hover:text-blue-400 cursor-pointer"
                    >
                      <span>Schedule &amp; Track Highlights</span>
                      {expandedAgendaId === featuredEvent.id ? (
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>

                    {expandedAgendaId === featuredEvent.id && (
                      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                        {featuredEvent.agenda.map((step) => (
                          <li key={step} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span>{featuredEvent.venue}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                      <Users className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span>
                        {featuredEvent.seatsRemaining} / {featuredEvent.seatsTotal} seats open
                      </span>
                    </span>
                  </div>

                  {registeredEventIds.includes(featuredEvent.id) ? (
                    <button
                      type="button"
                      onClick={() => onSelectEventForRegistration(featuredEvent)}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>Seat Reserved · View Pass</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectEventForRegistration(featuredEvent)}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      Reserve Seat
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        )}

        {/* Secondary Events Grid */}
        {secondaryEvents.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryEvents.map((ev) => {
              const isRegistered = registeredEventIds.includes(ev.id);
              const isExpanded = expandedAgendaId === ev.id;
              return (
                <article
                  key={ev.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    {/* Zero-pill metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-blue-700 dark:text-blue-400">
                        {ev.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{ev.date}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{ev.seatsRemaining} left</span>
                    </div>

                    <h3 className="mt-2.5 font-display text-xl font-semibold text-slate-950 dark:text-white leading-snug">
                      {ev.title}
                    </h3>

                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {ev.summary}
                    </p>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="font-mono tabular-nums">{ev.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{ev.venue}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setExpandedAgendaId(isExpanded ? null : ev.id)}
                        aria-expanded={isExpanded}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide agenda' : 'View session agenda'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </button>

                      {isExpanded && (
                        <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          {ev.agenda.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Lead: {ev.coordinator}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectEventForRegistration(ev)}
                      className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        isRegistered
                          ? 'border border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-900 text-white hover:bg-blue-700 dark:bg-slate-800 dark:hover:bg-blue-600'
                      }`}
                    >
                      {isRegistered ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Registered</span>
                        </>
                      ) : (
                        <span>Reserve Seat</span>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
