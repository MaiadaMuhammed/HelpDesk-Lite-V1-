/**
 * HelpDesk Lite (V1 MVP)
 * Authentication & User Profile Management Service
 * 
 * Provides dedicated profile management and credentials for:
 * 1. Maiada Muhammed (Employee / Requester)
 * 2. Eman Mostafa (Support / Agent)
 * 3. Huda Tarek (Manager / Operations)
 * Plus persistent registration for any new profiles.
 */

import { User, UserRole } from '../types/ticket';

export interface UserProfile extends User {
  jobTitle: string;
  department: string;
  avatarColor: string;
  password?: string;
  isPredefined?: boolean;
  createdAt?: string;
}

// -----------------------------------------------------------------------------
// The 3 Requested Default Profiles
// -----------------------------------------------------------------------------

export const PROFILE_MAIADA_EMPLOYEE: UserProfile = {
  id: 'usr_emp_maiada',
  name: 'Maiada Muhammed',
  email: 'maiada.muhammed@company.local',
  role: UserRole.REQUESTER,
  jobTitle: 'Employee & Operations Specialist',
  department: 'Business Operations & Employee Care',
  avatarColor: 'bg-emerald-600 text-white',
  password: 'employee123',
  isPredefined: true,
  createdAt: '2026-09-01T08:00:00.000Z',
};

export const PROFILE_EMAN_SUPPORT: UserProfile = {
  id: 'usr_agt_eman',
  name: 'Eman Mostafa',
  email: 'eman.mostafa@support.company.local',
  role: UserRole.AGENT,
  jobTitle: 'Lead Technical Support Specialist',
  department: 'Tier-2 IT & HelpDesk Support',
  avatarColor: 'bg-indigo-600 text-white',
  password: 'support123',
  isPredefined: true,
  createdAt: '2026-09-01T08:00:00.000Z',
};

export const PROFILE_HUDA_MANAGER: UserProfile = {
  id: 'usr_mgr_huda',
  name: 'Huda Tarek',
  email: 'huda.tarek@management.company.local',
  role: UserRole.MANAGER,
  jobTitle: 'HelpDesk & Service Operations Manager',
  department: 'Service Management & Executive IT',
  avatarColor: 'bg-purple-600 text-white',
  password: 'manager123',
  isPredefined: true,
  createdAt: '2026-09-01T08:00:00.000Z',
};

export const DEFAULT_PROFILES: UserProfile[] = [
  PROFILE_MAIADA_EMPLOYEE,
  PROFILE_EMAN_SUPPORT,
  PROFILE_HUDA_MANAGER,
];

const STORAGE_PROFILES_KEY = 'hdl_user_profiles_v1';
const STORAGE_AUTH_USER_KEY = 'hdl_active_auth_user_v1';

/**
 * Retrieve all registered profiles (defaults merged with custom signups)
 */
export function getStoredProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
    if (!raw) {
      return DEFAULT_PROFILES;
    }
    const customProfiles: UserProfile[] = JSON.parse(raw);
    // Ensure all 3 predefined profiles are always present
    const map = new Map<string, UserProfile>();
    DEFAULT_PROFILES.forEach((p) => map.set(p.id, p));
    customProfiles.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  } catch (err) {
    console.warn('Failed to parse stored user profiles:', err);
    return DEFAULT_PROFILES;
  }
}

/**
 * Persist custom profiles to localStorage
 */
export function saveCustomProfiles(profiles: UserProfile[]): void {
  try {
    const customOnly = profiles.filter((p) => !p.isPredefined);
    localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(customOnly));
  } catch (err) {
    console.warn('Failed to save user profiles to localStorage:', err);
  }
}

/**
 * Register a new user profile
 */
export function registerUserProfile(data: {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  jobTitle?: string;
  password?: string;
}): UserProfile {
  const existing = getStoredProfiles();
  const emailLower = data.email.trim().toLowerCase();

  const duplicate = existing.find((p) => p.email.toLowerCase() === emailLower);
  if (duplicate) {
    throw new Error(`A profile with email "${data.email}" already exists.`);
  }

  const rolePrefix =
    data.role === UserRole.REQUESTER
      ? 'usr_emp'
      : data.role === UserRole.AGENT
      ? 'usr_agt'
      : 'usr_mgr';

  const newId = `${rolePrefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  const avatarColor =
    data.role === UserRole.REQUESTER
      ? 'bg-emerald-600 text-white'
      : data.role === UserRole.AGENT
      ? 'bg-blue-600 text-white'
      : 'bg-purple-600 text-white';

  const defaultJobTitle =
    data.jobTitle?.trim() ||
    (data.role === UserRole.REQUESTER
      ? 'Employee'
      : data.role === UserRole.AGENT
      ? 'Support Specialist'
      : 'Support Manager');

  const newProfile: UserProfile = {
    id: newId,
    name: data.name.trim(),
    email: emailLower,
    role: data.role,
    jobTitle: defaultJobTitle,
    department: data.department.trim() || 'General Operations',
    avatarColor,
    password: data.password || 'password123',
    isPredefined: false,
    createdAt: new Date().toISOString(),
  };

  const updatedList = [...existing, newProfile];
  saveCustomProfiles(updatedList);
  setActiveAuthUser(newProfile);

  return newProfile;
}

/**
 * Authenticate with email & password
 */
export function authenticateUser(
  email: string,
  password?: string
): { user?: UserProfile; error?: string } {
  const emailClean = email.trim().toLowerCase();
  const profiles = getStoredProfiles();

  const found = profiles.find((p) => p.email.toLowerCase() === emailClean);
  if (!found) {
    return { error: 'No account found with this email address.' };
  }

  // If password provided and profile has a password, verify
  if (password && found.password && found.password !== password.trim()) {
    return { error: 'Invalid password. Please check your credentials.' };
  }

  setActiveAuthUser(found);
  return { user: found };
}

/**
 * Get the currently authenticated user from localStorage, if any
 */
export function getActiveAuthUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Cross-check that user exists in stored profiles
    const all = getStoredProfiles();
    return all.find((p) => p.id === parsed.id) || parsed;
  } catch {
    return null;
  }
}

/**
 * Set or clear the active authenticated user
 */
export function setActiveAuthUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_AUTH_USER_KEY);
    }
  } catch (err) {
    console.warn('Failed to update active auth user in localStorage:', err);
  }
}

/**
 * Returns initials for avatar display
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
