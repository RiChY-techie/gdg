import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarPlus,
  Check,
  Download,
  Inbox,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Ticket,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  addMemberDirectly,
  approveOrRejectJoinRequest,
  authorizeAdminEmail,
  createEventInFirestore,
  fetchAdminDashboard,
  removeMemberFromFirestore,
  toggleCheckinInFirestore,
  toggleInquiryStatusInFirestore,
  updateMemberRoleInFirestore,
} from '../services/firestoreClubService';
import {
  AdminDashboardPayload,
  AdminSessionUser,
  AdminUserRecord,
  ClubMemberRecord,
  ContactInquiryItem,
  EventRegistrationItem,
  JoinRequestRecord,
} from '../types/portal';

type AdminTab = 'overview' | 'requests' | 'members' | 'registrations' | 'events' | 'governance';

interface AdminDashboardModalProps {
  open: boolean;
  adminUser: AdminSessionUser;
  onClose: () => void;
  onLogout: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  open,
  adminUser,
  onClose,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [data, setData] = useState<AdminDashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Member filters
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'heads' | 'members'>('all');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemName, setNewMemName] = useState('');
  const [newMemUsn, setNewMemUsn] = useState('');
  const [newMemEmail, setNewMemEmail] = useState('');
  const [newMemSem, setNewMemSem] = useState('3rd Semester');
  const [newMemDomain, setNewMemDomain] = useState('Web & Cloud');
  const [newMemRole, setNewMemRole] = useState<'Member' | 'Domain Lead' | 'Club Head'>('Member');

  // Registration filters
  const [regEventFilter, setRegEventFilter] = useState('all');

  // Create event form
  const [evtTitle, setEvtTitle] = useState('');
  const [evtCategory, setEvtCategory] = useState<'Workshop' | 'Hackathon' | 'Study Jam' | 'Tech Talk'>('Workshop');
  const [evtDate, setEvtDate] = useState('');
  const [evtVenue, setEvtVenue] = useState('');
  const [evtSeats, setEvtSeats] = useState('80');
  const [evtSummary, setEvtSummary] = useState('');

  // Governance Role Grant form
  const [govName, setGovName] = useState('');
  const [govEmail, setGovEmail] = useState('');
  const [govDesignation, setGovDesignation] =
    useState<AdminUserRecord['designation']>('HOD');
  const [govDept, setGovDept] = useState('Computer Science & Engineering, RIT Hassan');
  const [govNotice, setGovNotice] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await fetchAdminDashboard();
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void fetchDashboard();
    }
  }, [open, fetchDashboard]);

  const currentStats = useMemo(() => {
    return {
      totalMembers: data?.summary.totalMembers ?? 0,
      totalHeads: data?.summary.headsCount ?? 0,
      totalEvents: data?.events.length ?? 0,
      totalRegistrations: data?.summary.totalRegistrations ?? 0,
    };
  }, [data]);

  const filteredMembers = useMemo(() => {
    if (!data) return [];
    const q = memberSearch.trim().toLowerCase();
    return data.members.filter((m) => {
      const roleMatch =
        roleFilter === 'all' ||
        (roleFilter === 'heads' && (m.clubRole === 'Club Head' || m.clubRole === 'Domain Lead')) ||
        (roleFilter === 'members' && m.clubRole === 'Member');
      const queryMatch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.usn.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.domain.toLowerCase().includes(q);
      return roleMatch && queryMatch;
    });
  }, [data, memberSearch, roleFilter]);

  const filteredRegistrations = useMemo(() => {
    if (!data) return [];
    return data.registrations.filter(
      (r) => regEventFilter === 'all' || r.eventId === regEventFilter
    );
  }, [data, regEventFilter]);

  if (!open) return null;

  const handleJoinDecision = async (req: JoinRequestRecord, decision: 'approved' | 'rejected') => {
    setError('');
    try {
      await approveOrRejectJoinRequest(
        req,
        decision,
        `${adminUser.name} (${adminUser.designation})`,
        currentStats
      );
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update request.');
    }
  };

  const handleChangeMemberRole = async (
    member: ClubMemberRecord,
    clubRole: ClubMemberRecord['clubRole']
  ) => {
    setError('');
    try {
      await updateMemberRoleInFirestore(member, clubRole, currentStats);
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update role.');
    }
  };

  const handleRemoveMember = async (member: ClubMemberRecord) => {
    setError('');
    try {
      await removeMemberFromFirestore(member, currentStats);
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove member.');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await addMemberDirectly(
        {
          name: newMemName,
          usn: newMemUsn,
          email: newMemEmail,
          semester: newMemSem,
          domain: newMemDomain,
          clubRole: newMemRole,
        },
        currentStats
      );
      setNewMemName('');
      setNewMemUsn('');
      setNewMemEmail('');
      setShowAddMember(false);
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add member.');
    }
  };

  const handleToggleCheckin = async (reg: EventRegistrationItem) => {
    setError('');
    try {
      await toggleCheckinInFirestore(reg);
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update check-in status.');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createEventInFirestore(
        {
          title: evtTitle,
          category: evtCategory,
          date: evtDate,
          venue: evtVenue,
          seatsTotal: Number(evtSeats) || 60,
          summary: evtSummary,
          coordinator: adminUser.name,
        },
        currentStats
      );
      setEvtTitle('');
      setEvtDate('');
      setEvtVenue('');
      setEvtSummary('');
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create event.');
    }
  };

  const handleToggleInquiry = async (inq: ContactInquiryItem) => {
    setError('');
    try {
      await toggleInquiryStatusInFirestore(inq);
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update inquiry status.');
    }
  };

  const handleAuthorizeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGovNotice('');
    try {
      await authorizeAdminEmail({
        name: govName,
        email: govEmail,
        designation: govDesignation,
        department: govDept,
      });
      setGovNotice(`Authorized ${govEmail.trim().toLowerCase()} as ${govDesignation}.`);
      setGovName('');
      setGovEmail('');
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not grant admin access.');
    }
  };

  const handleExportRegistrationsCsv = () => {
    if (!filteredRegistrations.length) return;
    const headers = ['Pass Code', 'Student Name', 'USN', 'Email', 'Semester', 'Event', 'Checked In'];
    const rows = filteredRegistrations.map((r) => [
      r.passCode,
      `"${r.studentName}"`,
      r.usn,
      r.email,
      `"${r.semester}"`,
      `"${r.eventTitle}"`,
      r.checkedIn ? 'Yes' : 'No',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rit-cse-event-participants.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const pendingRequests = data?.joinRequests.filter((r) => r.status === 'pending') || [];
  const clubHeads =
    data?.members.filter((m) => m.clubRole === 'Club Head' || m.clubRole === 'Domain Lead') || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-console-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-2 sm:p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0B101B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar Contract */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
              <span className="truncate">
                Governance Console / {adminUser.designation} · {adminUser.name}
              </span>
            </div>
            <h2
              id="admin-console-title"
              className="font-display text-lg font-bold text-slate-950 dark:text-white truncate"
            >
              GDG on Campus – RIT Hassan · CSE Club Administration
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close administration console"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          <aside className="w-full md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60 overflow-x-auto md:overflow-y-auto">
            <nav aria-label="Admin console sections" className="flex md:flex-col gap-1">
              {(
                [
                  { id: 'overview', label: 'Overview & Stats', icon: LayoutDashboard },
                  {
                    id: 'requests',
                    label: `Join Requests (${pendingRequests.length})`,
                    icon: UserPlus,
                  },
                  {
                    id: 'members',
                    label: `Members & Heads (${data?.members.length ?? 0})`,
                    icon: Users,
                  },
                  {
                    id: 'registrations',
                    label: `Participants (${data?.registrations.length ?? 0})`,
                    icon: Ticket,
                  },
                  { id: 'events', label: 'Events & Inquiries', icon: CalendarPlus },
                  { id: 'governance', label: 'Principal & HOD Access', icon: ShieldCheck },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-blue-600'
                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="tabular-nums">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="hidden md:block mt-6 border-t border-slate-200 pt-4 px-2 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Firebase Auth Session
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {adminUser.name}
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400">
                {adminUser.designation}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {adminUser.email}
              </p>
            </div>
          </aside>

          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </div>
            )}

            {loading && !data && (
              <div className="space-y-4">
                <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
            )}

            {/* 1. OVERVIEW */}
            {data && activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Students in Club</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
                      {data.summary.totalMembers}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Club Heads &amp; Leads</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
                      {data.summary.headsCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pending Join Requests</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {data.summary.pendingRequestsCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Event Registrations</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                      {data.summary.totalRegistrations}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                      <h3 className="font-display text-base font-semibold text-slate-950 dark:text-white">
                        Designated Member Heads &amp; Domain Leads
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('members')}
                        className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
                      >
                        Manage Roster →
                      </button>
                    </div>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                            <th className="py-2 pr-3 font-medium">Name</th>
                            <th className="py-2 pr-3 font-medium">USN</th>
                            <th className="py-2 pr-3 font-medium">Role</th>
                            <th className="py-2 font-medium">Track</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {clubHeads.map((h) => (
                            <tr key={h.id}>
                              <td className="py-2.5 pr-3 font-semibold text-slate-900 dark:text-slate-100">
                                {h.name}
                              </td>
                              <td className="py-2.5 pr-3 font-mono text-slate-600 dark:text-slate-300">
                                {h.usn}
                              </td>
                              <td className="py-2.5 pr-3 font-medium text-blue-700 dark:text-blue-400">
                                {h.clubRole}
                              </td>
                              <td className="py-2.5 text-slate-600 dark:text-slate-300">
                                {h.domain}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-5">
                    <div>
                      <h3 className="font-display text-base font-semibold text-slate-950 dark:text-white border-b border-slate-200 pb-3 dark:border-slate-800">
                        Student Distribution by Semester
                      </h3>
                      <div className="mt-3 space-y-2.5">
                        {Object.entries(data.summary.semesterBreakdown).map(([sem, count]) => (
                          <div key={sem} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-700 dark:text-slate-300">{sem}</span>
                              <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                                {count} students
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (count / Math.max(1, data.summary.totalMembers)) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {pendingRequests.length > 0 && (
                      <div className="border-t border-slate-200 pt-4 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                          {pendingRequests.length} student(s) awaiting club admission
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('requests')}
                          className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 cursor-pointer"
                        >
                          Review Queue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. JOIN REQUESTS */}
            {data && activeTab === 'requests' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                    Club Membership Requests
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Approve or decline student requests stored in Firestore. Approved students are
                    added directly to the Member roster.
                  </p>
                </div>

                {data.joinRequests.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                    No membership applications in queue.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                    {data.joinRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-sm text-slate-950 dark:text-white">
                              {req.name}
                            </span>
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {req.usn}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-600 dark:text-slate-400">{req.semester}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-blue-700 dark:text-blue-400">
                              {req.domain}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {req.statement}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {req.email} · Submitted {req.submittedAt}
                            {req.reviewedBy ? ` · Reviewed by ${req.reviewedBy}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {req.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleJoinDecision(req, 'approved')}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleJoinDecision(req, 'rejected')}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <span
                              className={`text-xs font-semibold ${
                                req.status === 'approved'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {req.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. MEMBERS & HEADS */}
            {data && activeTab === 'members' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                      Club Members &amp; Leadership Roster
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Promote members to Club Head / Domain Lead, add students directly, or remove
                      members in Firestore.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddMember((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 cursor-pointer self-start"
                  >
                    <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{showAddMember ? 'Close Form' : 'Add Member'}</span>
                  </button>
                </div>

                {showAddMember && (
                  <form
                    onSubmit={handleAddMember}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <input
                      type="text"
                      required
                      value={newMemName}
                      onChange={(e) => setNewMemName(e.target.value)}
                      placeholder="Student Name"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      required
                      value={newMemUsn}
                      onChange={(e) => setNewMemUsn(e.target.value)}
                      placeholder="USN (e.g. 4RA24CS099)"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <input
                      type="email"
                      required
                      value={newMemEmail}
                      onChange={(e) => setNewMemEmail(e.target.value)}
                      placeholder="student@gmail.com"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <select
                      value={newMemSem}
                      onChange={(e) => setNewMemSem(e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="1st Semester">1st Semester</option>
                      <option value="3rd Semester">3rd Semester</option>
                      <option value="5th Semester">5th Semester</option>
                      <option value="7th Semester">7th Semester</option>
                    </select>
                    <select
                      value={newMemDomain}
                      onChange={(e) => setNewMemDomain(e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="Web & Cloud">Web &amp; Cloud</option>
                      <option value="AI & ML">AI &amp; ML</option>
                      <option value="Systems & IoT">Systems &amp; IoT</option>
                      <option value="Algorithms & CP">Algorithms &amp; CP</option>
                    </select>
                    <div className="flex gap-2">
                      <select
                        value={newMemRole}
                        onChange={(e) =>
                          setNewMemRole(e.target.value as 'Member' | 'Domain Lead' | 'Club Head')
                        }
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="Member">Member</option>
                        <option value="Domain Lead">Domain Lead</option>
                        <option value="Club Head">Club Head</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-blue-600 cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search by name, USN, or domain..."
                      className="w-full sm:w-64 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
                    {(
                      [
                        { id: 'all', label: 'All Students' },
                        { id: 'heads', label: 'Heads & Leads' },
                        { id: 'members', label: 'Members' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setRoleFilter(f.id)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                          roleFilter === f.id
                            ? 'bg-slate-900 text-white dark:bg-blue-600'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                        <th className="px-4 py-2.5 font-medium">Student</th>
                        <th className="px-4 py-2.5 font-medium">USN</th>
                        <th className="px-4 py-2.5 font-medium">Semester</th>
                        <th className="px-4 py-2.5 font-medium">Track</th>
                        <th className="px-4 py-2.5 font-medium">Club Role</th>
                        <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {m.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {m.email}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                            {m.usn}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {m.semester}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {m.domain}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Change club role for ${m.name}`}
                              value={m.clubRole}
                              onChange={(e) =>
                                handleChangeMemberRole(
                                  m,
                                  e.target.value as ClubMemberRecord['clubRole']
                                )
                              }
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                            >
                              <option value="Member">Member</option>
                              <option value="Domain Lead">Domain Lead</option>
                              <option value="Club Head">Club Head</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m)}
                              aria-label={`Remove ${m.name} from club`}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" aria-hidden="true" />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. EVENT PARTICIPANTS */}
            {data && activeTab === 'registrations' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                      Event &amp; CODESTORM 2026 Participants
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Verify attendee passes, toggle check-in status, or export participant CSV.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Filter participants by event"
                      value={regEventFilter}
                      onChange={(e) => setRegEventFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="all">All Events</option>
                      {data.events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleExportRegistrationsCsv}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                        <th className="px-4 py-2.5 font-medium">Pass Code</th>
                        <th className="px-4 py-2.5 font-medium">Participant</th>
                        <th className="px-4 py-2.5 font-medium">USN</th>
                        <th className="px-4 py-2.5 font-medium">Event</th>
                        <th className="px-4 py-2.5 font-medium text-right">Check-In</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredRegistrations.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-3 font-mono font-semibold text-blue-700 dark:text-blue-400">
                            {r.passCode}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {r.studentName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {r.email} · {r.semester}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                            {r.usn}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                            {r.eventTitle}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleCheckin(r)}
                              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                                r.checkedIn
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                              }`}
                            >
                              <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{r.checkedIn ? 'Checked In' : 'Mark Present'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. EVENTS & INQUIRIES */}
            {data && activeTab === 'events' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleCreateEvent}
                  className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3.5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
                    Publish New Club Event
                  </h3>
                  <input
                    type="text"
                    required
                    value={evtTitle}
                    onChange={(e) => setEvtTitle(e.target.value)}
                    placeholder="Event title (e.g., Rust Systems Lab)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <select
                      value={evtCategory}
                      onChange={(e) =>
                        setEvtCategory(
                          e.target.value as 'Workshop' | 'Hackathon' | 'Study Jam' | 'Tech Talk'
                        )
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="Workshop">Workshop</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Study Jam">Study Jam</option>
                      <option value="Tech Talk">Tech Talk</option>
                    </select>
                    <input
                      type="text"
                      required
                      value={evtDate}
                      onChange={(e) => setEvtDate(e.target.value)}
                      placeholder="Date (e.g., Jan 24, 2027)"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      value={evtVenue}
                      onChange={(e) => setEvtVenue(e.target.value)}
                      placeholder="Venue (e.g., CSE Lab 204)"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <input
                      type="number"
                      min={10}
                      value={evtSeats}
                      onChange={(e) => setEvtSeats(e.target.value)}
                      placeholder="Total Seats"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={evtSummary}
                    onChange={(e) => setEvtSummary(e.target.value)}
                    placeholder="Concise session summary..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 cursor-pointer"
                  >
                    Create &amp; Publish Event
                  </button>
                </form>

                <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                    <Inbox className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
                      Contact &amp; Workshop Inquiries ({data.inquiries.length})
                    </h3>
                  </div>

                  <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                    {data.inquiries.map((inq) => (
                      <div key={inq.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {inq.name} ·{' '}
                            <span className="font-mono text-blue-700 dark:text-blue-400">
                              {inq.referenceId}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {inq.topic} · {inq.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {inq.message}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleInquiry(inq)}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold shrink-0 cursor-pointer ${
                            inq.status === 'reviewed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {inq.status === 'reviewed' ? 'Reviewed' : 'Mark Reviewed'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. PRINCIPAL / HOD GOVERNANCE ROLES */}
            {data && activeTab === 'governance' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleAuthorizeAdmin}
                  className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3.5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
                    Authorize Principal / HOD / Coordinator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add an institutional Google account email to grant Admin Console privileges in
                    Firestore.
                  </p>
                  {govNotice && (
                    <p className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {govNotice}
                    </p>
                  )}
                  <input
                    type="text"
                    required
                    value={govName}
                    onChange={(e) => setGovName(e.target.value)}
                    placeholder="Full Name (e.g., Dr. Mahesh T)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <input
                    type="email"
                    required
                    value={govEmail}
                    onChange={(e) => setGovEmail(e.target.value)}
                    placeholder="Google Email (e.g., principal.rit@gmail.com)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <select
                    value={govDesignation}
                    onChange={(e) =>
                      setGovDesignation(e.target.value as AdminUserRecord['designation'])
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="Principal">Principal</option>
                    <option value="HOD">HOD</option>
                    <option value="Faculty Advisor">Faculty Advisor</option>
                    <option value="Student Coordinator">Student Coordinator</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={govDept}
                    onChange={(e) => setGovDept(e.target.value)}
                    placeholder="Department / Office"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 cursor-pointer"
                  >
                    Grant Admin Access
                  </button>
                </form>

                <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="font-display text-base font-bold text-slate-950 dark:text-white border-b border-slate-200 pb-3 dark:border-slate-800">
                    Authorized Governance Directory ({data.admins.length})
                  </h3>
                  <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                    {data.admins.map((adm) => (
                      <div key={adm.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {adm.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {adm.email} · {adm.department}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 shrink-0">
                          {adm.designation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
