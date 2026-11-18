import React, { useEffect, useState } from 'react';
import { Award, Check, LogOut, Ticket, Users, X } from 'lucide-react';
import { fetchMemberPortalPayload, updateMyMemberProfile } from '../services/firestoreClubService';
import { ClubMemberRecord, MemberPortalPayload, MemberSessionUser } from '../types/portal';

interface MemberPortalModalProps {
  open: boolean;
  memberUser: MemberSessionUser;
  firebaseUid: string;
  onClose: () => void;
  onLogout: () => void;
  onProfileUpdated: (updated: ClubMemberRecord) => void;
}

export const MemberPortalModal: React.FC<MemberPortalModalProps> = ({
  open,
  memberUser,
  firebaseUid,
  onClose,
  onLogout,
  onProfileUpdated,
}) => {
  const [data, setData] = useState<MemberPortalPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Editable fields
  const [domain, setDomain] = useState(memberUser.domain);
  const [semester, setSemester] = useState(memberUser.semester);
  const [githubHandle, setGithubHandle] = useState(memberUser.githubHandle || '');
  const [bio, setBio] = useState(memberUser.bio || '');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!open || !firebaseUid) return;
    let active = true;
    setLoading(true);
    setError('');

    const baseMember: ClubMemberRecord = {
      id: memberUser.id,
      uid: memberUser.uid || firebaseUid,
      name: memberUser.name,
      usn: memberUser.usn,
      email: memberUser.email,
      semester: memberUser.semester,
      domain: memberUser.domain,
      clubRole: memberUser.clubRole,
      joinedAt: memberUser.joinedAt,
      attendanceRate: memberUser.attendanceRate,
      githubHandle: memberUser.githubHandle,
      bio: memberUser.bio,
    };

    fetchMemberPortalPayload(baseMember, firebaseUid)
      .then((payload) => {
        if (!active) return;
        setData(payload);
        setDomain(payload.member.domain);
        setSemester(payload.member.semester);
        setGithubHandle(payload.member.githubHandle || '');
        setBio(payload.member.bio || '');
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, firebaseUid, memberUser]);

  if (!open) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    setError('');
    try {
      await updateMyMemberProfile(memberUser.id, { domain, semester, githubHandle, bio });
      if (data) {
        const updatedMember: ClubMemberRecord = {
          ...data.member,
          domain,
          semester,
          githubHandle: githubHandle.trim(),
          bio: bio.trim(),
        };
        setData({ ...data, member: updatedMember });
        onProfileUpdated(updatedMember);
      }
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-portal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0D1320]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-[#0D1320]">
          <div>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
              GDG on Campus – RIT Hassan · Dept. of CSE Member Portal
            </p>
            <h2
              id="member-portal-title"
              className="font-display text-xl font-bold text-slate-950 dark:text-white"
            >
              {data ? `${data.member.name} · ${data.member.usn}` : 'Member Profile'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close member portal"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="space-y-3">
              <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-40 rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Club Designation</p>
                  <p className="mt-1 font-display text-lg font-bold text-slate-950 dark:text-white">
                    {data.member.clubRole}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Session Attendance</p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">
                    {data.member.attendanceRate}%
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">My Event Passes</p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">
                    {data.registrations.length}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Club Members</p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">
                    {data.totalClubStudents}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleSaveProfile}
                  className="lg:col-span-6 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold text-slate-950 dark:text-white">
                      My Member Information
                    </h3>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      Joined {data.member.joinedAt}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Email</span>
                      <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100 truncate">
                        {data.member.email}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">USN</span>
                      <p className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {data.member.usn}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Technical Domain
                      </label>
                      <select
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="Web & Cloud">Web &amp; Cloud</option>
                        <option value="AI & ML">AI &amp; ML</option>
                        <option value="Systems & IoT">Systems &amp; IoT</option>
                        <option value="Algorithms & CP">Algorithms &amp; CP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Semester
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="1st Semester">1st Semester</option>
                        <option value="3rd Semester">3rd Semester</option>
                        <option value="5th Semester">5th Semester</option>
                        <option value="7th Semester">7th Semester</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      GitHub Username
                    </label>
                    <input
                      type="text"
                      value={githubHandle}
                      onChange={(e) => setGithubHandle(e.target.value)}
                      placeholder="github-handle"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Engineering Bio / Focus
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {savedNotice ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        Saved to Firestore
                      </span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 cursor-pointer"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>

                <div className="lg:col-span-6 space-y-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2 mb-3">
                      <Ticket className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                      <h3 className="font-display text-base font-semibold text-slate-950 dark:text-white">
                        My Registered Events
                      </h3>
                    </div>

                    {data.registrations.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        You have no event passes yet. Reserve a seat from the Events calendar.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {data.registrations.map((reg) => (
                          <div key={reg.id} className="py-2.5 first:pt-0 last:pb-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {reg.eventTitle}
                              </p>
                              <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                                {reg.passCode}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              {reg.eventDate} · {reg.eventVenue} ·{' '}
                              {reg.checkedIn ? 'Checked In' : 'Confirmed'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                      <h3 className="font-display text-base font-semibold text-slate-950 dark:text-white">
                        Club Heads &amp; Domain Leads
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {data.heads.map((head) => (
                        <div key={head.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {head.name}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400">
                              {head.domain} · {head.semester}
                            </p>
                          </div>
                          <span className="font-medium text-blue-700 dark:text-blue-400">
                            {head.clubRole}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="tabular-nums">
                        {data.totalClubStudents} active CSE students enrolled this semester
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
