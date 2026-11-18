import React, { useState } from 'react';
import { CheckCircle2, Mail, MapPin, Phone, Send, UserPlus } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithGoogle, submitInquiryToFirestore } from '../services/firestoreClubService';

interface SubmittedInquiry {
  referenceId: string;
  name: string;
  email: string;
  topic: string;
}

interface ContactSectionProps {
  onOpenJoinApplication: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onOpenJoinApplication }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [usn, setUsn] = useState('');
  const [topic, setTopic] = useState('Club Membership');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<SubmittedInquiry | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!validEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setError('Please write a brief message (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const user = auth.currentUser ?? (await signInWithGoogle());
      const created = await submitInquiryToFirestore(user.uid, {
        name: name.trim(),
        email: trimmedEmail,
        usn: usn.trim(),
        topic,
        message: message.trim(),
      });

      setSubmitted({
        referenceId: created.referenceId,
        name: created.name,
        email: created.email,
        topic: created.topic,
      });
      setName('');
      setEmail('');
      setUsn('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="border-b border-slate-200/80 bg-white py-16 sm:py-24 dark:border-slate-800/80 dark:bg-[#0D1320]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Contact Information Column */}
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Club Membership &amp; Department Contact
            </p>
            <h2
              className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              Connect with GDG on Campus – RIT Hassan &amp; Dept. of CSE.
            </h2>

            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Interested in joining the CSE student developer club, proposing a technical session,
              or mentoring a study jam? Apply for club membership directly or message the department
              administrators.
            </p>

            <div className="mt-6">
              <button
                type="button"
                onClick={onOpenJoinApplication}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-blue-600/30 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-950/60 dark:text-blue-300 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                <span>Submit Official Club Membership Request</span>
              </button>
            </div>

            <dl className="mt-8 space-y-5 border-t border-slate-200 pt-6 text-sm dark:border-slate-800">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-1 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="font-semibold text-slate-900 dark:text-white">
                    Department &amp; Campus Address
                  </dt>
                  <dd className="mt-0.5 text-slate-600 dark:text-slate-300">
                    Department of Computer Science &amp; Engineering, Rajeev Institute of Technology,
                    Plot 1-D, Growth Centre, Industrial Area, B.M. Bypass Road, Hassan – 573201,
                    Karnataka
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-1 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="font-semibold text-slate-900 dark:text-white">
                    Official Chapter Email
                  </dt>
                  <dd className="mt-0.5 text-slate-600 dark:text-slate-300">
                    <a
                      href="mailto:gdg.rithassan@gmail.com"
                      className="hover:text-blue-700 dark:hover:text-blue-400 underline underline-offset-4"
                    >
                      gdg.rithassan@gmail.com
                    </a>{' '}
                    ·{' '}
                    <a
                      href="mailto:cseclub@rithassan.ac.in"
                      className="hover:text-blue-700 dark:hover:text-blue-400 underline underline-offset-4"
                    >
                      cseclub@rithassan.ac.in
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-1 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="font-semibold text-slate-900 dark:text-white">
                    Student Coordinator &amp; Lab Hours
                  </dt>
                  <dd className="mt-0.5 text-slate-600 dark:text-slate-300">
                    Yashawantha H M · GDG on Campus – RIT Hassan
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                      Mon – Sat · 09:00 AM – 04:30 PM IST
                    </span>
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Interactive Contact Form Column */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              {submitted ? (
                <div className="py-6">
                  <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
                    <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                      Inquiry Logged for Review
                    </h3>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    Thank you, <span className="font-semibold text-slate-900 dark:text-white">{submitted.name}</span>. Your message regarding{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">{submitted.topic}</span> is now visible in the HOD &amp; Coordinator Admin Console. Confirmation email:{' '}
                    <span className="font-mono text-xs">{submitted.email}</span>.
                  </p>

                  <p className="mt-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                    Reference ID: {submitted.referenceId}
                  </p>

                  <button
                    type="button"
                    onClick={() => setSubmitted(null)}
                    className="mt-6 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
                    <h3 className="font-display text-lg font-semibold text-slate-950 dark:text-white">
                      Send a Message to Department Coordinators
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Messages are persisted to the department inquiry queue for HOD &amp; coordinator review.
                    </p>
                  </div>

                  {error && (
                    <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Full Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Email Address
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@rithassan.ac.in"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-usn"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        USN / Semester (optional)
                      </label>
                      <input
                        id="contact-usn"
                        type="text"
                        value={usn}
                        onChange={(e) => setUsn(e.target.value)}
                        placeholder="4RA24CS012"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-topic"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Inquiry Topic
                      </label>
                      <select
                        id="contact-topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="Club Membership">Club Membership</option>
                        <option value="CODESTORM 2026 Query">CODESTORM 2026 Query</option>
                        <option value="Workshop or Tech Talk Proposal">
                          Workshop or Tech Talk Proposal
                        </option>
                        <option value="Industry / Alumni Partnership">
                          Industry / Alumni Partnership
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your technical interests, project idea, or question for the coordinators..."
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Open to all RIT Hassan students
                    </span>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <Send className="w-4 h-4" aria-hidden="true" />
                      <span>{submitting ? 'Submitting...' : 'Submit Message'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
