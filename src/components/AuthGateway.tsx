/**
 * HelpDesk Lite (V1 MVP)
 * Authentication Gateway: Login & Sign Up Screen
 * 
 * Features:
 * - 3 Dedicated Signup Profiles:
 *   1. Maiada Muhammed (Employee / Requester)
 *   2. Eman Mostafa (Support / Agent)
 *   3. Huda Tarek (Manager / Operations)
 * - 1-Click Instant Demo Login
 * - Standard Email & Password Sign In
 * - Full Profile Sign Up form for new employees, support agents, or managers
 */

import React, { useState } from 'react';
import {
  UserProfile,
  DEFAULT_PROFILES,
  PROFILE_MAIADA_EMPLOYEE,
  PROFILE_EMAN_SUPPORT,
  PROFILE_HUDA_MANAGER,
  getStoredProfiles,
  registerUserProfile,
  authenticateUser,
  getInitials,
} from '../services/authService';
import { UserRole } from '../types/ticket';
import {
  Layers,
  UserCheck,
  ShieldCheck,
  User,
  Headphones,
  ArrowRight,
  Sparkles,
  KeyRound,
  Mail,
  Lock,
  Building2,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Check,
} from 'lucide-react';

interface AuthGatewayProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'PROFILES' | 'SIGNIN' | 'SIGNUP'>('PROFILES');
  const [profiles, setProfiles] = useState<UserProfile[]>(() => getStoredProfiles());

  // Sign In state
  const [signInEmail, setSignInEmail] = useState<string>('');
  const [signInPassword, setSignInPassword] = useState<string>('');
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up state
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupRole, setSignupRole] = useState<UserRole>(UserRole.REQUESTER);
  const [signupDepartment, setSignupDepartment] = useState<string>('');
  const [signupJobTitle, setSignupJobTitle] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  // Handle instant one-click login from profile card
  const handleQuickLogin = (profile: UserProfile) => {
    onLoginSuccess(profile);
  };

  // Handle standard credential sign in
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    if (!signInEmail.trim()) {
      setSignInError('Please enter your work email address.');
      return;
    }

    const result = authenticateUser(signInEmail, signInPassword);
    if (result.error || !result.user) {
      setSignInError(result.error || 'Authentication failed. Please verify credentials.');
      return;
    }

    onLoginSuccess(result.user);
  };

  // Prefill sign in form for quick testing
  const handlePrefillCredentials = (profile: UserProfile) => {
    setSignInEmail(profile.email);
    setSignInPassword(profile.password || '');
    setSignInError(null);
  };

  // Handle registration
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);

    if (!signupName.trim()) {
      setSignupError('Please provide your full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setSignupError('Please provide a valid work email address.');
      return;
    }
    if (!signupDepartment.trim()) {
      setSignupError('Please enter your department.');
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setSignupError('Password must be at least 4 characters.');
      return;
    }

    try {
      const created = registerUserProfile({
        name: signupName,
        email: signupEmail,
        role: signupRole,
        department: signupDepartment,
        jobTitle: signupJobTitle,
        password: signupPassword,
      });

      setProfiles(getStoredProfiles());
      setSignupSuccess(`Account created for ${created.name}! Signing in...`);

      setTimeout(() => {
        onLoginSuccess(created);
      }, 700);
    } catch (err: any) {
      setSignupError(err.message || 'Failed to register account. Please try again.');
    }
  };

  const customProfiles = profiles.filter((p) => !p.isPredefined);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 antialiased">
      {/* Container */}
      <div className="w-full max-w-4xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>HelpDesk Lite • HDL-06 Enterprise Lifecycle</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Layers className="w-6 h-6" />
            </div>
            <span>HelpDesk Lite Portal</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Choose an official profile to enter or create your own account with role-based state machine permissions.
          </p>
        </div>

        {/* Auth Navigation Tabs */}
        <div className="bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex max-w-md mx-auto">
          <button
            type="button"
            id="tab-btn-profiles"
            onClick={() => setActiveTab('PROFILES')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'PROFILES'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3 Quick Profiles</span>
          </button>

          <button
            type="button"
            id="tab-btn-signin"
            onClick={() => setActiveTab('SIGNIN')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'SIGNIN'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            id="tab-btn-signup"
            onClick={() => setActiveTab('SIGNUP')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'SIGNUP'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* TAB 1: 3 OFFICIAL QUICK PROFILES */}
        {activeTab === 'PROFILES' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Profile 1: Maiada Muhammed (Employee) */}
              <div
                id="profile-card-maiada"
                className="bg-slate-800/90 rounded-2xl border-2 border-emerald-500/40 hover:border-emerald-400 p-5 shadow-xl transition-all hover:translate-y-[-2px] flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none -mr-6 -mt-6" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      1. Employee Profile
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">REQUESTER</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-base shadow-md">
                      {getInitials(PROFILE_MAIADA_EMPLOYEE.name)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {PROFILE_MAIADA_EMPLOYEE.name}
                      </h2>
                      <p className="text-xs text-emerald-400 font-medium">
                        {PROFILE_MAIADA_EMPLOYEE.jobTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[190px]">
                        {PROFILE_MAIADA_EMPLOYEE.email}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/60 mb-4 text-xs text-slate-300 space-y-1.5">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-[11px]">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Employee Capabilities:</span>
                    </div>
                    <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                      <li>Submit IT/HR/Facilities tickets</li>
                      <li>Public discussion messages & attachments</li>
                      <li>Approve final solution & close ticket</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 mb-2 flex items-center justify-between">
                    <span>Department: <strong>{PROFILE_MAIADA_EMPLOYEE.department}</strong></span>
                  </div>
                  <button
                    type="button"
                    id="btn-login-maiada"
                    onClick={() => handleQuickLogin(PROFILE_MAIADA_EMPLOYEE)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:scale-[1.02]"
                  >
                    <span>Log In as Maiada</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Profile 2: Eman Mostafa (Support Agent) */}
              <div
                id="profile-card-eman"
                className="bg-slate-800/90 rounded-2xl border-2 border-indigo-500/40 hover:border-indigo-400 p-5 shadow-xl transition-all hover:translate-y-[-2px] flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none -mr-6 -mt-6" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      <Headphones className="w-3 h-3" />
                      2. Support Profile
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">AGENT</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center text-white font-black text-base shadow-md">
                      {getInitials(PROFILE_EMAN_SUPPORT.name)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {PROFILE_EMAN_SUPPORT.name}
                      </h2>
                      <p className="text-xs text-indigo-400 font-medium">
                        {PROFILE_EMAN_SUPPORT.jobTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[190px]">
                        {PROFILE_EMAN_SUPPORT.email}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/60 mb-4 text-xs text-slate-300 space-y-1.5">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-[11px]">
                      <Check className="w-3 h-3 text-indigo-400" />
                      <span>Support Capabilities:</span>
                    </div>
                    <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                      <li>Claim tickets from triage pool</li>
                      <li>Transition to In Progress & Resolved</li>
                      <li>Internal staff notes & alert acknowledgments</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 mb-2 flex items-center justify-between">
                    <span>Department: <strong>{PROFILE_EMAN_SUPPORT.department}</strong></span>
                  </div>
                  <button
                    type="button"
                    id="btn-login-eman"
                    onClick={() => handleQuickLogin(PROFILE_EMAN_SUPPORT)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:scale-[1.02]"
                  >
                    <span>Log In as Eman</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Profile 3: Huda Tarek (Operations Manager) */}
              <div
                id="profile-card-huda"
                className="bg-slate-800/90 rounded-2xl border-2 border-purple-500/40 hover:border-purple-400 p-5 shadow-xl transition-all hover:translate-y-[-2px] flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none -mr-6 -mt-6" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      3. Manager Profile
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">MANAGER</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-700 flex items-center justify-center text-white font-black text-base shadow-md">
                      {getInitials(PROFILE_HUDA_MANAGER.name)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                        {PROFILE_HUDA_MANAGER.name}
                      </h2>
                      <p className="text-xs text-purple-400 font-medium">
                        {PROFILE_HUDA_MANAGER.jobTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[190px]">
                        {PROFILE_HUDA_MANAGER.email}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/60 mb-4 text-xs text-slate-300 space-y-1.5">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-[11px]">
                      <Check className="w-3 h-3 text-purple-400" />
                      <span>Manager Capabilities:</span>
                    </div>
                    <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                      <li>Force-reassign & unassign tickets</li>
                      <li>Full team SLA & MTTR dashboard metrics</li>
                      <li>Transition overrides & closure approvals</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 mb-2 flex items-center justify-between">
                    <span>Department: <strong>{PROFILE_HUDA_MANAGER.department}</strong></span>
                  </div>
                  <button
                    type="button"
                    id="btn-login-huda"
                    onClick={() => handleQuickLogin(PROFILE_HUDA_MANAGER)}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:scale-[1.02]"
                  >
                    <span>Log In as Huda</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* If custom registered profiles exist, list them too */}
            {customProfiles.length > 0 && (
              <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Custom Registered Profiles ({customProfiles.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {customProfiles.map((cp) => (
                    <div
                      key={cp.id}
                      className="bg-slate-900/70 border border-slate-700/80 rounded-lg p-3 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <div className="font-bold text-xs text-white truncate">{cp.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{cp.role} • {cp.department}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin(cp)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                      >
                        Log In
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STANDARD SIGN IN */}
        {activeTab === 'SIGNIN' && (
          <div className="max-w-md mx-auto bg-slate-800/90 rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Sign In to Your Account</h2>
              <p className="text-xs text-slate-400">
                Enter your work email and password or use a quick autofill option below.
              </p>
            </div>

            {signInError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{signInError}</span>
              </div>
            )}

            {/* Quick Fill Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Quick Fill Preset:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePrefillCredentials(PROFILE_MAIADA_EMPLOYEE)}
                  className="px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium text-center transition-colors cursor-pointer truncate"
                  title="Autofill Maiada Muhammed"
                >
                  Maiada (Emp)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrefillCredentials(PROFILE_EMAN_SUPPORT)}
                  className="px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium text-center transition-colors cursor-pointer truncate"
                  title="Autofill Eman Mostafa"
                >
                  Eman (Support)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrefillCredentials(PROFILE_HUDA_MANAGER)}
                  className="px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-[11px] font-medium text-center transition-colors cursor-pointer truncate"
                  title="Autofill Huda Tarek"
                >
                  Huda (Manager)
                </button>
              </div>
            </div>

            <form onSubmit={handleSignInSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Work Email</span>
                </label>
                <input
                  type="email"
                  id="input-signin-email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="e.g. maiada.muhammed@company.local"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  id="input-signin-password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-signin"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In to HelpDesk</span>
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-400">
              <span>Don't have a profile yet? </span>
              <button
                type="button"
                onClick={() => setActiveTab('SIGNUP')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
              >
                Sign Up here
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SIGN UP NEW PROFILE */}
        {activeTab === 'SIGNUP' && (
          <div className="max-w-lg mx-auto bg-slate-800/90 rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Create a New Profile</h2>
              <p className="text-xs text-slate-400">
                Register a new team member and assign their role in the 5-state lifecycle engine.
              </p>
            </div>

            {signupError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{signupError}</span>
              </div>
            )}

            {signupSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{signupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  id="input-signup-name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Farida Khaled"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Work Email *</span>
                </label>
                <input
                  type="email"
                  id="input-signup-email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="e.g. farida.khaled@company.local"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Role Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Select Account Role *</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole(UserRole.REQUESTER)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      signupRole === UserRole.REQUESTER
                        ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs text-emerald-300 flex items-center gap-1 mb-0.5">
                      <User className="w-3 h-3" />
                      <span>Employee</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      Requester role (submits tickets & verifies solutions)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole(UserRole.AGENT)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      signupRole === UserRole.AGENT
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs text-indigo-300 flex items-center gap-1 mb-0.5">
                      <Headphones className="w-3 h-3" />
                      <span>Support</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      Agent role (claims queue, transitions states)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole(UserRole.MANAGER)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      signupRole === UserRole.MANAGER
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs text-purple-300 flex items-center gap-1 mb-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Manager</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      Manager role (SLA metrics, reassigns, overrides)
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Department *</span>
                  </label>
                  <input
                    type="text"
                    id="input-signup-department"
                    value={signupDepartment}
                    onChange={(e) => setSignupDepartment(e.target.value)}
                    placeholder="e.g. IT Engineering"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>Job Title</span>
                  </label>
                  <input
                    type="text"
                    id="input-signup-jobtitle"
                    value={signupJobTitle}
                    onChange={(e) => setSignupJobTitle(e.target.value)}
                    placeholder="e.g. Systems Engineer"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password *</span>
                </label>
                <input
                  type="password"
                  id="input-signup-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-signup"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Create Profile & Sign In</span>
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-400">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => setActiveTab('SIGNIN')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
              >
                Sign In here
              </button>
            </div>
          </div>
        )}

        {/* Footer: HDL-06 Engine Explainer */}
        <div className="bg-slate-800/40 rounded-xl border border-slate-800 p-3.5 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-3">
          <span className="font-semibold text-slate-300">5-State Lifecycle Engine:</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">NEW</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">ASSIGNED</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">IN_PROGRESS</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">RESOLVED</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/30">CLOSED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
