import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Plus, Search, X } from 'lucide-react';
import { ProjectDomain, StudentProject } from '../data/clubData';
import { ResilientImage } from './ResilientImage';

interface ProjectsSectionProps {
  projects: StudentProject[];
  onAddProject: (project: StudentProject) => Promise<void>;
}

const DOMAINS: ProjectDomain[] = ['All', 'AI & ML', 'Web & Cloud', 'Systems & IoT', 'Campus Tools'];

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects, onAddProject }) => {
  const [selectedDomain, setSelectedDomain] = useState<ProjectDomain>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProject, setActiveProject] = useState<StudentProject | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  // Submit project form state
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<Exclude<ProjectDomain, 'All'>>('Web & Cloud');
  const [semester, setSemester] = useState('5th Sem CSE');
  const [contributors, setContributors] = useState('');
  const [stackInput, setStackInput] = useState('');
  const [summary, setSummary] = useState('');
  const [repoSlug, setRepoSlug] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((project) => {
      const domainMatch = selectedDomain === 'All' || project.domain === selectedDomain;
      const queryMatch =
        !q ||
        project.title.toLowerCase().includes(q) ||
        project.summary.toLowerCase().includes(q) ||
        project.contributors.toLowerCase().includes(q) ||
        project.stack.some((s) => s.toLowerCase().includes(q));
      return domainMatch && queryMatch;
    });
  }, [projects, selectedDomain, searchQuery]);

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setFormError('Project title must be at least 3 characters.');
      return;
    }
    if (!contributors.trim() || contributors.trim().length < 2) {
      setFormError('Please provide student contributor names.');
      return;
    }
    if (!summary.trim() || summary.trim().length < 10) {
      setFormError('Please provide a project summary of at least 10 characters.');
      return;
    }

    const parsedStack = stackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newProject: StudentProject = {
      id: `proj-${Date.now()}`,
      title: title.trim(),
      domain,
      semester: semester.trim() || 'CSE Dept',
      contributors: contributors.trim(),
      stack: parsedStack.length > 0 ? parsedStack : ['TypeScript'],
      summary: summary.trim(),
      architectureNote: 'Student-submitted repository registered via GDG on Campus – RIT Hassan showcase.',
      impactMetric: 'Open for peer review and campus testing',
      repoSlug:
        repoSlug.trim() ||
        `gdg-rit-hassan/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    };

    setSubmitting(true);
    setFormError('');
    try {
      await onAddProject(newProject);
      setTitle('');
      setContributors('');
      setStackInput('');
      setSummary('');
      setRepoSlug('');
      setSubmitModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to publish project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="projects"
      className="border-b border-slate-200/80 bg-white py-16 sm:py-24 dark:border-slate-800/80 dark:bg-[#0D1320]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Club Showcase · CSE Student Engineering
            </p>
            <h2
              className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              Club &amp; Department Open-Source Builds
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Production utilities, hardware monitors, and applied machine learning tools shipped by
              GDG on Campus – RIT Hassan and CSE Department club members.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSubmitModalOpen(true)}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Submit Student Project</span>
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-y border-slate-200 py-4 dark:border-slate-800">
          <div
            role="tablist"
            aria-label="Filter projects by domain"
            className="flex flex-wrap items-center gap-1"
          >
            {DOMAINS.map((item) => {
              const active = selectedDomain === item;
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedDomain(item)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stack or project..."
              aria-label="Search student projects"
              className="w-full sm:w-64 min-h-[40px] rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              No projects match your filter
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedDomain('All');
                setSearchQuery('');
              }}
              className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-white dark:border-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Show All Projects
            </button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => {
              const isLead = idx === 0 && project.image;
              return (
                <article
                  key={project.id}
                  className={`flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden dark:border-slate-800 dark:bg-slate-900/70 ${
                    isLead ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  <div className={isLead ? 'grid grid-cols-1 md:grid-cols-12 h-full' : 'flex flex-col h-full'}>
                    {isLead && project.image && (
                      <div className="md:col-span-5 min-h-[220px] bg-slate-200 dark:bg-slate-800">
                        <ResilientImage
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover"
                          fallbackTitle={project.title}
                        />
                      </div>
                    )}

                    <div className={`${isLead ? 'md:col-span-7' : ''} p-6 flex flex-col justify-between flex-1`}>
                      <div>
                        {/* Zero-pill metadata */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-blue-700 dark:text-blue-400">
                            {project.domain}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{project.semester}</span>
                        </div>

                        <h3 className="mt-2 font-display text-xl font-semibold text-slate-950 dark:text-white leading-snug">
                          {project.title}
                        </h3>

                        <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {project.summary}
                        </p>

                        <p className="mt-3 text-xs font-medium text-slate-800 dark:text-slate-200">
                          Outcome: {project.impactMetric}
                        </p>

                        <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {project.stack.join(' / ')}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {project.contributors}
                        </span>

                        <button
                          type="button"
                          onClick={() => setActiveProject(project)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
                        >
                          <span>Inspect Details</span>
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Detail Inspection Modal */}
      {activeProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setActiveProject(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  {activeProject.domain} · {activeProject.semester}
                </p>
                <h3
                  id="project-modal-title"
                  className="mt-1 font-display text-2xl font-bold text-slate-950 dark:text-white"
                >
                  {activeProject.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveProject(null)}
                aria-label="Close project details"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {activeProject.summary}
            </p>

            <dl className="mt-5 divide-y divide-slate-200 border-y border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-800">
              <div className="py-3">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Architecture &amp; Stack
                </dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">
                  {activeProject.architectureNote}
                </dd>
                <dd className="mt-1 font-mono text-xs text-blue-700 dark:text-blue-400">
                  {activeProject.stack.join(' · ')}
                </dd>
              </div>
              <div className="py-3">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Student Contributors
                </dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">
                  {activeProject.contributors}
                </dd>
              </div>
              <div className="py-3">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Measured Outcome
                </dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">
                  {activeProject.impactMetric}
                </dd>
              </div>
              <div className="py-3">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Repository Namespace
                </dt>
                <dd className="mt-1 font-mono text-xs text-slate-700 dark:text-slate-300">
                  github.com/{activeProject.repoSlug}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveProject(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit New Student Project Modal */}
      {submitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-project-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setSubmitModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="submit-project-title"
                  className="font-display text-xl font-bold text-slate-950 dark:text-white"
                >
                  Submit a CSE Student Project
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add your lab build or hackathon prototype to the department showcase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                aria-label="Close project submission modal"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProject} className="mt-5 space-y-4">
              {formError && (
                <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                  {formError}
                </p>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Smart Attendance Verifier"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Domain
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as Exclude<ProjectDomain, 'All'>)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="Web & Cloud">Web &amp; Cloud</option>
                    <option value="AI & ML">AI &amp; ML</option>
                    <option value="Systems & IoT">Systems &amp; IoT</option>
                    <option value="Campus Tools">Campus Tools</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Semester / Cohort
                  </label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g., 5th Sem CSE"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Team Contributors
                </label>
                <input
                  type="text"
                  required
                  value={contributors}
                  onChange={(e) => setContributors(e.target.value)}
                  placeholder="e.g., Raksha N, Kiran P"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Tech Stack (comma separated)
                  </label>
                  <input
                    type="text"
                    value={stackInput}
                    onChange={(e) => setStackInput(e.target.value)}
                    placeholder="React, Node.js, SQLite"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    GitHub Slug (optional)
                  </label>
                  <input
                    type="text"
                    value={repoSlug}
                    onChange={(e) => setRepoSlug(e.target.value)}
                    placeholder="username/repo-name"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Problem &amp; Implementation Summary
                </label>
                <textarea
                  rows={3}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Explain what problem your build solves and how it works."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
                >
                  {submitting ? 'Publishing...' : 'Publish to Showcase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
