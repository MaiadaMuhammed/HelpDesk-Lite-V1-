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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 antialiased">
      {/* Container */}
      <div className="w-full max-w-4xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-medium shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>HelpDesk Lite • HDL-06 Lifecycle Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            <Layers className="w-6 h-6 text-slate-800" />
            <span>HelpDesk Portal</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Select a verified team profile to sign in or create an account with role-based permissions.
          </p>
        </div>

        {/* Auth Navigation Tabs */}
        <div className="bg-slate-200/70 p-1 rounded-xl flex max-w-xs mx-auto text-xs">
          <button
            type="button"
            id="tab-btn-profiles"
            onClick={() => setActiveTab('PROFILES')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'PROFILES'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Profiles</span>
          </button>

          <button
            type="button"
            id="tab-btn-signin"
            onClick={() => setActiveTab('SIGNIN')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'SIGNIN'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Sign In</span>
          </button>

          <button
            type="button"
            id="tab-btn-signup"
            onClick={() => setActiveTab('SIGNUP')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'SIGNUP'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Sign Up</span>
          </button>
        </div>

        {/* TAB 1: 3 OFFICIAL QUICK PROFILES */}
        {activeTab === 'PROFILES' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Profile 1: Maiada Muhammed (Employee) */}
              <div
                id="profile-card-maiada"
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Employee Profile
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">REQUESTER</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      {getInitials(PROFILE_MAIADA_EMPLOYEE.name)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {PROFILE_MAIADA_EMPLOYEE.name}
                      </h2>
                      <p className="text-xs text-slate-500 truncate">
                        {PROFILE_MAIADA_EMPLOYEE.jobTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {PROFILE_MAIADA_EMPLOYEE.email}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 mb-4 text-xs text-slate-600 space-y-1">
                    <div className="font-medium text-slate-700 text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Role Capabilities:</span>
                    </div>
                    <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                      <li>Submit IT/HR/Facilities tickets</li>
                      <li>Public discussion messages & files</li>
                      <li>Approve final solution & close</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 mb-2.5 flex items-center justify-between">
                    <span>Department</span>
                    <span className="font-medium text-slate-600">{PROFILE_MAIADA_EMPLOYEE.department}</span>
                  </div>
                  <button
                    type="button"
                    id="btn-login-maiada"
                    onClick={() => handleQuickLogin(PROFILE_MAIADA_EMPLOYEE)}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Sign In as Maiada</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Profile 2: Eman Mostafa (Support Agent) */}
              <div
                id="profile-card-eman"
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <Headphones className="w-3 h-3" />
                      Support Profile
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">AGENT</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                      {getInitials(PROFILE_EMAN_SUPPORT.name)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                        {PROFILE_EMAN_SUPPORT.name}
                      </h2>
                      <p className="text-xs text-slate-500 truncate">
                        {PROFILE_EMAN_SUPPORT.jobTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {PROFILE_EMAN_SUPPORT.email}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 mb-4 text-xs text-slate-600 space-y-1">
                    <div className="font-medium text-slate-700 text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3 text-blue-600" />
                      <span>Role Capabilities:</span>
                    </div>
                    <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                      <li>Claim tickets from triage pool</li>
                      <li>Transition to In Progress & Resolved</li>
                      <li>Internal private notes & alerts</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 mb-2.5 flex items-center justify-between">
                    <span>Department</span>
                    <span className="font-medium text-slate-600">{PROFILE_EMAN_SUPPORT.department}</span>
                  </div>
                  <button
                    type="button"
                    id="btn-login-eman"
                    onClick={() => handleQuickLogin(PROFILE_EMAN_SUPPORT)}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Sign In as Eman</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Profile 3: Huda Tarek (Operations Manager) */}
              <div
                id="profile-card-huda"
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Manager Profile
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">MANAGER</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
                      {getInitials(PROFILE_HUDA_MANAGER.name)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                        {PROFILE_HUDA_MANAGER.name}
                      </h2>
                      <p className="text-xs text-slate-500 truncate">
                        {PROFILE_HUDA_MANAGER.jobTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {PROFILE_HUDA_MANAGER.email}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 mb-4 text-xs text-slate-600 space-y-1">
                    <div className="font-medium text-slate-700 text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3 text-purple-600" />
                      <span>Role Capabilities:</span>
                    </div>
                    <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                      <li>Force-reassign & unassign tickets</li>
                      <li>SLA & team performance metrics</li>
                      <li>Transition overrides & closures</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 mb-2.5 flex items-center justify-between">
                    <span>Department</span>
                    <span className="font-medium text-slate-600">{PROFILE_HUDA_MANAGER.department}</span>
                  </div>
                  <button
                    type="button"
                    id="btn-login-huda"
                    onClick={() => handleQuickLogin(PROFILE_HUDA_MANAGER)}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Sign In as Huda</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* If custom registered profiles exist, list them too */}
            {customProfiles.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Custom Registered Profiles ({customProfiles.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {customProfiles.map((cp) => (
                    <div
                      key={cp.id}
                      className="bg-slate-50 border border-slate-200/70 rounded-lg p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <div className="font-semibold text-xs text-slate-900 truncate">{cp.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{cp.role} • {cp.department}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin(cp)}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                      >
                        Sign In
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
          <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-base font-semibold text-slate-900">Sign In to Your Account</h2>
              <p className="text-xs text-slate-500">
                Enter your work credentials or use an autofill preset below.
              </p>
            </div>

            {signInError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{signInError}</span>
              </div>
            )}

            {/* Quick Fill Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500">Quick Fill Preset:</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePrefillCredentials(PROFILE_MAIADA_EMPLOYEE)}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-medium text-center transition-colors cursor-pointer truncate"
                  title="Autofill Maiada Muhammed"
                >
                  Maiada (Emp)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrefillCredentials(PROFILE_EMAN_SUPPORT)}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-medium text-center transition-colors cursor-pointer truncate"
                  title="Autofill Eman Mostafa"
                >
                  Eman (Support)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrefillCredentials(PROFILE_HUDA_MANAGER)}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-medium text-center transition-colors cursor-pointer truncate"
                  title="Autofill Huda Tarek"
                >
                  Huda (Manager)
                </button>
              </div>
            </div>

            <form onSubmit={handleSignInSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
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
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  id="input-signin-password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-signin"
                className="w-full py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In to HelpDesk</span>
              </button>
            </form>

            <div className="pt-1 text-center text-xs text-slate-500">
              <span>Don't have a profile yet? </span>
              <button
                type="button"
                onClick={() => setActiveTab('SIGNUP')}
                className="text-slate-900 hover:underline font-medium cursor-pointer"
              >
                Sign Up here
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SIGN UP NEW PROFILE */}
        {activeTab === 'SIGNUP' && (
          <div className="max-w-lg mx-auto bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-base font-semibold text-slate-900">Create a New Profile</h2>
              <p className="text-xs text-slate-500">
                Register a new team member and assign their role in the lifecycle engine.
              </p>
            </div>

            {signupError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{signupError}</span>
              </div>
            )}

            {signupSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{signupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSignUpSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
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
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
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
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              {/* Role Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  <span>Select Account Role *</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole(UserRole.REQUESTER)}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      signupRole === UserRole.REQUESTER
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1 mb-0.5">
                      <User className="w-3 h-3" />
                      <span>Employee</span>
                    </div>
                    <div className={`text-[10px] leading-tight ${signupRole === UserRole.REQUESTER ? 'text-slate-300' : 'text-slate-400'}`}>
                      Requester (submits & verifies)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole(UserRole.AGENT)}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      signupRole === UserRole.AGENT
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1 mb-0.5">
                      <Headphones className="w-3 h-3" />
                      <span>Support</span>
                    </div>
                    <div className={`text-[10px] leading-tight ${signupRole === UserRole.AGENT ? 'text-slate-300' : 'text-slate-400'}`}>
                      Agent (claims & solves)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole(UserRole.MANAGER)}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      signupRole === UserRole.MANAGER
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1 mb-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Manager</span>
                    </div>
                    <div className={`text-[10px] leading-tight ${signupRole === UserRole.MANAGER ? 'text-slate-300' : 'text-slate-400'}`}>
                      Manager (SLA & overrides)
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
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
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>Job Title</span>
                  </label>
                  <input
                    type="text"
                    id="input-signup-jobtitle"
                    value={signupJobTitle}
                    onChange={(e) => setSignupJobTitle(e.target.value)}
                    placeholder="e.g. Systems Engineer"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
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
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-signup"
                className="w-full py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Create Profile & Sign In</span>
              </button>
            </form>

            <div className="pt-1 text-center text-xs text-slate-500">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => setActiveTab('SIGNIN')}
                className="text-slate-900 hover:underline font-medium cursor-pointer"
              >
                Sign In here
              </button>
            </div>
          </div>
        )}

        {/* Footer: HDL-06 Engine Explainer */}
        <div className="p-3 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-2">
          <span>Lifecycle states:</span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800">NEW</span>
            <span className="text-slate-300">→</span>
            <span className="font-semibold text-slate-800">ASSIGNED</span>
            <span className="text-slate-300">→</span>
            <span className="font-semibold text-slate-800">IN_PROGRESS</span>
            <span className="text-slate-300">→</span>
            <span className="font-semibold text-slate-800">RESOLVED</span>
            <span className="text-slate-300">→</span>
            <span className="font-semibold text-slate-800">CLOSED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
