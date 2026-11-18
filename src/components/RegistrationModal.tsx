import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { CheckCircle2, Trash2, X } from 'lucide-react';
import { ClubEvent } from '../data/clubData';
import { registerForEventInFirestore, signInWithGoogle } from '../services/firestoreClubService';
import { AuthUser, EventRegistrationItem } from '../types/portal';

interface RegistrationModalProps {
  event: ClubEvent | null;
  existingRegistration?: EventRegistrationItem;
  allRegistrations: EventRegistrationItem[];
  showAllPasses: boolean;
  authUser: AuthUser | null;
  firebaseUser: User | null;
  onClose: () => void;
  onRegistered: (registration: EventRegistrationItem) => void;
  onCancelRegistration: (registration: EventRegistrationItem) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  existingRegistration,
  allRegistrations,
  showAllPasses,
  authUser,
  firebaseUser,
  onClose,
  onRegistered,
  onCancelRegistration,
}) => {
  const [studentName, setStudentName] = useState('');
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');
  const [semester, setSemester] = useState('5th Semester');
  const [track, setTrack] = useState('Web & Cloud');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      if (authUser) {
        setStudentName(authUser.name);
        setEmail(authUser.email);
        if (authUser.role === 'member') {
          setUsn(authUser.usn);
          setSemester(authUser.semester);
          setTrack(authUser.domain);
        }
      } else if (firebaseUser) {
        if (firebaseUser.displayName) setStudentName(firebaseUser.displayName);
        if (firebaseUser.email) setEmail(firebaseUser.email);
      }
    }
    setError('');
  }, [event, authUser, firebaseUser]);

  if (!event && !showAllPasses) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    const trimmedEmail = email.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (!studentName.trim() || studentName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!usn.trim() || usn.trim().length < 4) {
      setError('Please enter your college USN or roll number (e.g., 4RA23CS045).');
      return;
    }
    if (!emailValid) {
      setError('Please enter a valid email address for your event pass.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const user = firebaseUser ?? (await signInWithGoogle());
      const created = await registerForEventInFirestore(user.uid, event, {
        studentName: studentName.trim(),
        usn: usn.trim().toUpperCase(),
        email: trimmedEmail,
        semester,
        track,
      });
      onRegistered(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
              {showAllPasses
                ? 'GDG on Campus – RIT Hassan · Club Event Passes'
                : `${event?.category} · ${event?.date}`}
            </p>
            <h3
              id="reg-modal-title"
              className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-950 dark:text-white"
            >
              {showAllPasses ? 'Your Reserved Event Passes' : event?.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close registration modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* All Passes View */}
        {showAllPasses && (
          <div className="mt-6 space-y-4">
            {allRegistrations.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You have not reserved any event seats yet.
              </p>
            ) : (
              allRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                        Pass {reg.passCode}
                      </p>
                      <h4 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-white">
                        {reg.eventTitle}
                      </h4>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {reg.eventDate} · {reg.eventVenue}
                      </p>
                      <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                        {reg.studentName} ({reg.usn}) · {reg.semester}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCancelRegistration(reg)}
                      aria-label={`Cancel pass for ${reg.eventTitle}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-red-300 hover:text-red-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-red-800 dark:hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Single Event Existing Pass Confirmation */}
        {!showAllPasses && event && existingRegistration && (
          <div className="mt-6 rounded-xl border border-emerald-600/30 bg-emerald-50/70 p-5 dark:border-emerald-500/30 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold">Seat Confirmed in Firestore</span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Attendee</dt>
                <dd className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                  {existingRegistration.studentName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Pass Code</dt>
                <dd className="mt-0.5 font-mono font-semibold text-blue-700 dark:text-blue-400">
                  {existingRegistration.passCode}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">USN / ID</dt>
                <dd className="mt-0.5 font-mono text-slate-800 dark:text-slate-200">
                  {existingRegistration.usn}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Venue</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{event.venue}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between border-t border-emerald-600/20 pt-4">
              <button
                type="button"
                onClick={() => onCancelRegistration(existingRegistration)}
                className="text-xs font-medium text-red-700 hover:underline dark:text-red-400 cursor-pointer"
              >
                Release Seat
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Registration Form */}
        {!showAllPasses && event && !existingRegistration && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Venue: {event.venue} · {event.time} · Coordinator: {event.coordinator}
            </p>

            {!firebaseUser && (
              <p className="rounded-lg border border-blue-600/20 bg-blue-50/70 px-3 py-2 text-xs text-blue-800 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300">
                Google Sign-In opens automatically when you confirm to save your pass securely in
                Firestore.
              </p>
            )}

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Participant Full Name
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g., Chethan B"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  USN / Student ID
                </label>
                <input
                  type="text"
                  required
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                  placeholder="4RA23CS024"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono uppercase text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="3rd Semester">3rd Semester</option>
                  <option value="5th Semester">5th Semester</option>
                  <option value="7th Semester">7th Semester</option>
                  <option value="Faculty / Guest">Faculty / Guest</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@rithassan.ac.in"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Track Preference
                </label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="Web & Cloud">Web &amp; Cloud</option>
                  <option value="AI & ML">AI &amp; ML</option>
                  <option value="Systems & IoT">Systems &amp; IoT</option>
                  <option value="Campus Tools">Campus Tools</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
              >
                {submitting
                  ? 'Reserving Seat...'
                  : firebaseUser
                    ? 'Confirm Seat'
                    : 'Sign In & Confirm Seat'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
