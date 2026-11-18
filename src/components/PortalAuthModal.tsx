import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { CheckCircle2, ShieldCheck, UserCheck, UserPlus, X } from 'lucide-react';
import {
  resolveAdminSession,
  resolveMemberRecord,
  seedFirestoreIfNeeded,
  signInWithGoogle,
  submitJoinRequestToFirestore,
} from '../services/firestoreClubService';
import { AuthUser } from '../types/portal';

export type AuthModalTab = 'admin' | 'member' | 'join';

interface PortalAuthModalProps {
  open: boolean;
  initialTab: AuthModalTab;
  firebaseUser: User | null;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
}

export const PortalAuthModal: React.FC<PortalAuthModalProps> = ({
  open,
  initialTab,
  firebaseUser,
  onClose,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<AuthModalTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Join Request fields
  const [joinName, setJoinName] = useState('');
  const [joinUsn, setJoinUsn] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinSemester, setJoinSemester] = useState('3rd Semester');
  const [joinDomain, setJoinDomain] = useState('Web & Cloud');
  const [joinStatement, setJoinStatement] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setError('');
      setJoinSuccess('');
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (open && firebaseUser) {
      if (firebaseUser.displayName) {
        setJoinName((prev) => prev || firebaseUser.displayName || '');
      }
      if (firebaseUser.email) {
        setJoinEmail((prev) => prev || firebaseUser.email || '');
      }
    }
  }, [open, firebaseUser]);

  if (!open) return null;

  const handleGoogleAdminLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = firebaseUser ?? (await signInWithGoogle());
      const adminSession = await resolveAdminSession(user);
      if (!adminSession) {
        setError(
          `The account ${user.email || ''} does not have Admin privileges in /admins. Ask the Principal, HOD, or Project Owner (chethanb187@gmail.com) to authorize your email in Governance Roles.`
        );
        setLoading(false);
        return;
      }
      await seedFirestoreIfNeeded(user.uid);
      onAuthSuccess(adminSession);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to complete Google Admin sign-in.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMemberLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = firebaseUser ?? (await signInWithGoogle());
      const member = await resolveMemberRecord(user);
      if (!member) {
        setError(
          `No approved club membership found for ${user.email || 'this Google account'}. Submit a Join Request or ask an Admin to add your email to the club roster.`
        );
        setLoading(false);
        return;
      }
      onAuthSuccess({
        id: member.id,
        uid: member.uid || user.uid,
        role: 'member',
        name: member.name,
        usn: member.usn,
        email: member.email,
        semester: member.semester,
        domain: member.domain,
        clubRole: member.clubRole,
        joinedAt: member.joinedAt,
        attendanceRate: member.attendanceRate,
        githubHandle: member.githubHandle,
        bio: member.bio,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to complete Google Member sign-in.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (tab === 'admin') {
        const adminSession = await resolveAdminSession(user);
        if (!adminSession) {
          setError(
            `The account ${user.email || ''} is not authorized in /admins. Contact an existing Admin to grant Principal/HOD/Coordinator access.`
          );
          setLoading(false);
          return;
        }
        await seedFirestoreIfNeeded(user.uid);
        onAuthSuccess(adminSession);
      } else {
        const member = await resolveMemberRecord(user);
        if (!member) {
          setError(
            `No approved club membership found for ${user.email || ''}. Submit a Join Request first.`
          );
          setLoading(false);
          return;
        }
        onAuthSuccess({
          id: member.id,
          uid: member.uid || user.uid,
          role: 'member',
          name: member.name,
          usn: member.usn,
          email: member.email,
          semester: member.semester,
          domain: member.domain,
          clubRole: member.clubRole,
          joinedAt: member.joinedAt,
          attendanceRate: member.attendanceRate,
          githubHandle: member.githubHandle,
          bio: member.bio,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google account switch cancelled.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setJoinSuccess('');
    setLoading(true);
    try {
      const user = firebaseUser ?? (await signInWithGoogle());
      const created = await submitJoinRequestToFirestore(user.uid, {
        name: joinName,
        usn: joinUsn,
        email: joinEmail || user.email || '',
        semester: joinSemester,
        domain: joinDomain,
        statement: joinStatement,
      });
      setJoinSuccess(
        `Application submitted to Firestore for ${created.name} (${created.usn}). Once approved by the Principal, HOD, or Club Coordinator, sign in via Member Login using your Google account.`
      );
      setJoinUsn('');
      setJoinStatement('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to submit membership request.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-auth-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
              GDG on Campus – RIT Hassan · Dept. of CSE Club
            </p>
            <h2
              id="portal-auth-title"
              className="mt-1 font-display text-2xl font-bold text-slate-950 dark:text-white"
            >
              {tab === 'admin'
                ? 'Administration & Governance'
                : tab === 'member'
                  ? 'Club Member Portal'
                  : 'Apply to Join the CSE Club'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close portal authentication modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Select portal mode"
          className="mt-5 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'admin'}
            onClick={() => {
              setTab('admin');
              setError('');
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'admin'
                ? 'bg-slate-900 text-white dark:bg-blue-600'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Admin Login</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'member'}
            onClick={() => {
              setTab('member');
              setError('');
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'member'
                ? 'bg-slate-900 text-white dark:bg-blue-600'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Member Login</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'join'}
            onClick={() => {
              setTab('join');
              setError('');
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'join'
                ? 'bg-slate-900 text-white dark:bg-blue-600'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Join Request</span>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {/* Admin or Member Google Auth View */}
        {(tab === 'admin' || tab === 'member') && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              {tab === 'admin' ? (
                <>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Principal, CSE HOD, Faculty Advisor &amp; Coordinator Console
                  </p>
                  <p className="mt-1">
                    Sign in with Google Authentication to inspect club student counts, designated
                    member heads, approve or decline join requests, manage rosters, verify event
                    participants, and grant additional Principal/HOD emails.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Approved CSE Club Member Access
                  </p>
                  <p className="mt-1">
                    Sign in with the Google email linked to your club membership to view your USN
                    standing, attendance rate, designated club heads, and registered event passes.
                  </p>
                </>
              )}
            </div>

            {firebaseUser && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-950">
                <div className="min-w-0">
                  <span className="text-slate-500 dark:text-slate-400">Signed-in Google ID: </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {firebaseUser.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  disabled={loading}
                  className="text-blue-700 hover:underline dark:text-blue-400 font-semibold shrink-0 cursor-pointer"
                >
                  Switch Google Account
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={tab === 'admin' ? handleGoogleAdminLogin : handleGoogleMemberLogin}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2.5 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
            >
              {tab === 'admin' ? (
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              ) : (
                <UserCheck className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {loading
                  ? 'Verifying Firebase Credentials...'
                  : firebaseUser
                    ? tab === 'admin'
                      ? `Continue as Admin (${firebaseUser.email})`
                      : `Open Member Portal (${firebaseUser.email})`
                    : tab === 'admin'
                      ? 'Sign In with Google (Admin)'
                      : 'Sign In with Google (Member)'}
              </span>
            </button>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {tab === 'admin'
                ? 'First-time setup: signing in with the project owner Google account automatically initializes Firestore collections and governance access.'
                : 'New student? Switch to Join Request to submit your USN and interest statement for HOD/Coordinator approval.'}
            </p>
          </div>
        )}

        {/* Join Club Request Form */}
        {tab === 'join' && (
          <div className="mt-5">
            {joinSuccess ? (
              <div className="rounded-xl border border-emerald-600/30 bg-emerald-50/70 p-5 dark:border-emerald-500/30 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold">Saved to Firestore Queue</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {joinSuccess}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setJoinSuccess('');
                    setTab('member');
                  }}
                  className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white dark:bg-blue-600 cursor-pointer"
                >
                  Go to Member Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-3.5">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Submit a club membership application. Google Sign-In verifies your student
                  identity so Admins can approve your USN into the Member Portal.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                      placeholder="Student full name"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      USN
                    </label>
                    <input
                      type="text"
                      required
                      value={joinUsn}
                      onChange={(e) => setJoinUsn(e.target.value)}
                      placeholder="4RA25CS040"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono uppercase text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Google / Institutional Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={joinEmail}
                    onChange={(e) => setJoinEmail(e.target.value)}
                    placeholder="student@gmail.com or student@rithassan.ac.in"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Semester
                    </label>
                    <select
                      value={joinSemester}
                      onChange={(e) => setJoinSemester(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="1st Semester">1st Semester</option>
                      <option value="3rd Semester">3rd Semester</option>
                      <option value="5th Semester">5th Semester</option>
                      <option value="7th Semester">7th Semester</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Preferred Technical Track
                    </label>
                    <select
                      value={joinDomain}
                      onChange={(e) => setJoinDomain(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="Web & Cloud">Web &amp; Cloud</option>
                      <option value="AI & ML">AI &amp; ML</option>
                      <option value="Systems & IoT">Systems &amp; IoT</option>
                      <option value="Algorithms & CP">Algorithms &amp; CP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Why do you want to join GDG on Campus – RIT Hassan?
                  </label>
                  <textarea
                    rows={2}
                    required
                    minLength={5}
                    value={joinStatement}
                    onChange={(e) => setJoinStatement(e.target.value)}
                    placeholder="Share your skills, projects, or learning goals..."
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[44px] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
                >
                  {loading
                    ? 'Submitting to Firestore...'
                    : firebaseUser
                      ? 'Submit Membership Request'
                      : 'Sign In with Google & Submit Request'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
