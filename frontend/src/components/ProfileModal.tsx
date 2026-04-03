"use client";
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import ConfirmModal from './ConfirmModal'; 

interface ProfileModalProps {
  onClose: () => void;
}

type Tab = 'profile' | 'security' | 'data';

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const router = useRouter();
  const { user, logout, changePassword, updateRetention, deleteAccount } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  // New State for logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError,   setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Retention state
  const [retention,  setRetention]  = useState(user?.data_retention_days || '90');
  const [retSuccess, setRetSuccess] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSuccess(false);
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const handleRetentionSave = async () => {
    await updateRetention(retention);
    setRetSuccess(true);
    setTimeout(() => setRetSuccess(false), 2500);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.email) {
      setDeleteError('Email does not match');
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount();
      router.push('/auth/login');
    } catch (err: any) {
      setDeleteError(err.message);
      setDeleteLoading(false);
    }
  };

  const handleLogoutConfirm = () => {
    logout();
    router.push('/auth/login');
    onClose(); 
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile',  label: 'Profile'   },
    { key: 'security', label: 'Security'  },
    { key: 'data',     label: 'My Data'   },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-200">Account Settings</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800 px-2">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-xs font-medium transition-colors ${
                  tab === t.key
                    ? 'text-blue-400 border-b-2 border-blue-500'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ── Profile tab ── */}
            {tab === 'profile' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-3 space-y-2">
                  <Row label="Sign-in method" value={user?.provider === 'google' ? 'Google' : 'Email & Password'} />
                  <Row label="Account status" value="Verified" valueClass="text-emerald-400" />
                </div>

                {user?.provider === 'google' && (
                  <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3">
                    <p className="text-xs text-blue-400/80 leading-relaxed">
                      You signed in with Google. Profile details are managed through your Google account. Password change is not available for Google accounts.
                    </p>
                  </div>
                )}

                {/* UPDATED: Button now triggers the local state instead of immediate logout */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-red-400 bg-slate-800/50 hover:bg-red-500/10 border border-slate-700 hover:border-red-800/50 py-2.5 rounded-xl transition-all"
                >
                  Sign out
                </button>
              </div>
            )}

            {/* ── Security tab ── */}
            {tab === 'security' && (
              <div>
                {user?.provider !== 'email' ? (
                  <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <p className="text-sm text-slate-400">Password management is not available for Google accounts.</p>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-3">
                    <p className="text-xs text-slate-500 mb-3">Choose a strong password of at least 8 characters. You'll receive a confirmation email after changing it.</p>
                    {[
                      { label: 'Current Password', value: currentPw, set: setCurrentPw },
                      { label: 'New Password',      value: newPw,     set: setNewPw     },
                      { label: 'Confirm New',        value: confirmPw, set: setConfirmPw },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-xs text-slate-400 font-medium mb-1.5 block">{f.label}</label>
                        <input
                          type="password"
                          value={f.value}
                          onChange={e => f.set(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                        />
                      </div>
                    ))}
                    {pwError   && <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">{pwError}</p>}
                    {pwSuccess && <p className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-lg px-3 py-2">Password changed successfully. A confirmation email has been sent.</p>}
                    <button type="submit" disabled={pwLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                      {pwLoading ? 'Updating…' : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ── Data tab (GDPR) ── */}
            {tab === 'data' && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-1">Data Retention</p>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Under GDPR Art.5, you control how long we keep your chat history. Older sessions are automatically deleted after your chosen period.
                  </p>
                  <select
                    value={retention}
                    onChange={e => setRetention(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
                  >
                    <option value="30">30 days</option>
                    <option value="90">90 days (recommended)</option>
                    <option value="365">1 year</option>
                    <option value="never">Keep indefinitely</option>
                  </select>
                  <button onClick={handleRetentionSave} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-xl text-xs font-medium transition-all">
                    {retSuccess ? '✓ Saved' : 'Save Preference'}
                  </button>
                </div>
                <hr className="border-slate-800" />
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-1">Delete Account (GDPR Art.17)</p>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Permanently deletes your account, all chat history, and all uploaded document fragments from our servers. This cannot be undone.
                  </p>
                  <input
                    type="email"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder={`Type ${user?.email} to confirm`}
                    className="w-full bg-slate-800 border border-red-900/50 text-slate-200 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-red-600 mb-2 placeholder:text-slate-600"
                  />
                  {deleteError && <p className="text-xs text-red-400 mb-2">{deleteError}</p>}
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirm !== user?.email}
                    className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-30 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    {deleteLoading ? 'Deleting…' : 'Permanently Delete My Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REUSABLE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign Out"
        description="Are you sure you want to sign out of your account? You will need to sign in again to access your chat history."
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        }
        actions={[
          {
            label: "Sign Out",
            variant: "danger",
            onClick: handleLogoutConfirm
          },
          {
            label: "Stay logged in",
            variant: "ghost",
            onClick: () => setShowLogoutConfirm(false)
          }
        ]}
      />
    </>
  );
}

function Row({ label, value, valueClass = 'text-slate-300' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}