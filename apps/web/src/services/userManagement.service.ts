import { apiFetch } from "@/lib/api";

export interface ManagedUser {
  id: string;
  name: string;
  firstName: string;
  surname: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  createdAt: string;
  roles: string[];
  roleCodes: string[];
  department: string;
  departmentId: string;
  transportType: string;
  homeRegion: string;
  city: string;
  streetName: string;
  blockNumber: string;
  regionId: string;
  territoryId: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DISABLED" | "ARCHIVED";
  online: boolean;
  lastSeenAt: string | null;
  appAccess: boolean;
  locked: boolean;
  incomplete: boolean;
  hasNationalIdFront: boolean;
  hasNationalIdBack: boolean;
  loginsThisWeek: number;
}

export interface UserManagementOverview {
  updatedAt: string;
  stats: {
    totalUsers: number;
    activeUsers: number;
    inactiveDisabled: number;
    onlineNow: number;
    newThisWeek: number;
    newThisMonth: number;
    loginsToday: number;
    neverLoggedIn: number;
    asrs: number;
    asrsWithTransport: number;
    tsms: number;
    distributors: number;
    adminsAndRsms: number;
    loginsThisWeek: number;
    suspended: number;
    incompleteProfiles: number;
  };
  signups: Array<{ date: string; count: number }>;
  topActiveUsers: Array<{ userId: string; name: string; count: number }>;
  onlineUserIds: string[];
  users: ManagedUser[];
  departments: Array<{ id: string; name: string }>;
  regions: Array<{ id: string; name: string; territories: Array<{ id: string; name: string }> }>;
  roles: Array<{ id: string; code: string; name: string }>;
  loginAttempts: Array<{ userId: string | null; name: string; successful: boolean; createdAt: string }>;
  shift: { closeStart: string; closeEnd: string; reopenAt: string; updatedAt: string; updatedBy: string | null };
}

export const userManagementService = {
  async getOverview() {
    const response = await apiFetch<{ data: UserManagementOverview }>("/api/v1/users");
    return response.data;
  },

  async createUser(formData: FormData) {
    return apiFetch<{ data: { id: string } }>("/api/v1/users", { method: "POST", body: formData });
  },

  async updateUser(userId: string, formData: FormData) {
    return apiFetch<{ data: { id: string } }>(`/api/v1/users/${userId}`, { method: "PUT", body: formData });
  },

  async createDepartment(name: string) {
    return apiFetch<{ data: { id: string; name: string } }>("/api/v1/users/departments", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  async createTerritory(regionId: string, name: string) {
    return apiFetch<{ data: { id: string; name: string; regionId: string } }>("/api/v1/users/territories", {
      method: "POST",
      body: JSON.stringify({ regionId, name }),
    });
  },

  async updateShift(shift: { closeStart: string; closeEnd: string; reopenAt: string }) {
    return apiFetch("/api/v1/users/asr-shift", { method: "PUT", body: JSON.stringify(shift) });
  },

  async updateStatus(userId: string, status: ManagedUser["status"]) {
    return apiFetch(`/api/v1/users/${userId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  },

  async unlock(userId: string) {
    return apiFetch(`/api/v1/users/${userId}/unlock`, { method: "POST" });
  },

  async unlockAll() {
    return apiFetch<{ data: { unlocked: number } }>("/api/v1/users/unlock-all", { method: "POST" });
  },

  async checkout(userId: string) {
    return apiFetch(`/api/v1/users/${userId}/checkout`, { method: "POST" });
  },

  async checkoutAll() {
    return apiFetch<{ data: { loggedOut: number } }>("/api/v1/users/checkout-all", { method: "POST" });
  },

  identityDocumentUrl(userId: string, side: "front" | "back") {
    return `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}/api/v1/users/${userId}/identity/${side}`;
  },
};