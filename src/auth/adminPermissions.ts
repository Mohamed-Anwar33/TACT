export type StaffRole = "admin" | "manager" | "client_followup" | "technical_office";

export type AdminPermission = "dashboard" | "content" | "clients" | "roles" | "settings";

const STAFF_ROLES: StaffRole[] = ["admin", "manager", "client_followup", "technical_office"];

const ROLE_PERMISSIONS: Record<StaffRole, AdminPermission[]> = {
  admin: ["dashboard", "content", "clients", "roles", "settings"],
  manager: ["dashboard", "content", "clients"],
  client_followup: ["dashboard", "clients"],
  technical_office: ["dashboard", "content"],
};

const ROUTE_PERMISSIONS: { prefix: string; permission: AdminPermission; exact?: boolean }[] = [
  { prefix: "/admin", permission: "dashboard", exact: true },
  { prefix: "/admin/pages/", permission: "content" },
  { prefix: "/admin/services", permission: "content" },
  { prefix: "/admin/projects", permission: "content" },
  { prefix: "/admin/team", permission: "content" },
  { prefix: "/admin/clients", permission: "content" },
  { prefix: "/admin/packages", permission: "content" },
  { prefix: "/admin/contact", permission: "clients" },
  { prefix: "/admin/unlocks", permission: "clients" },
  { prefix: "/admin/selections", permission: "clients" },
  { prefix: "/admin/questionnaires", permission: "clients" },
  { prefix: "/admin/roles", permission: "roles" },
  { prefix: "/admin/settings", permission: "settings" },
];

const DEFAULT_ADMIN_PATHS: Record<AdminPermission, string> = {
  dashboard: "/admin",
  content: "/admin/pages/home",
  clients: "/admin/contact",
  roles: "/admin/roles",
  settings: "/admin/settings",
};

export function isStaffRole(role: string): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export function getAdminPermissions(roles: string[]): AdminPermission[] {
  const permissions = new Set<AdminPermission>();
  roles.filter(isStaffRole).forEach((role) => {
    ROLE_PERMISSIONS[role].forEach((permission) => permissions.add(permission));
  });
  return Array.from(permissions);
}

export function hasAdminPermission(roles: string[], permission: AdminPermission): boolean {
  return getAdminPermissions(roles).includes(permission);
}

export function isStaff(roles: string[]): boolean {
  return roles.some(isStaffRole);
}

export function canAccessAdminPath(roles: string[], pathname: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/admin";
  const match = ROUTE_PERMISSIONS.find((route) => (
    route.exact ? normalizedPath === route.prefix : normalizedPath.startsWith(route.prefix)
  ));

  if (!match) return false;
  return hasAdminPermission(roles, match.permission);
}

export function getFirstAdminPath(roles: string[]): string {
  const permissions = getAdminPermissions(roles);
  const ordered: AdminPermission[] = ["dashboard", "clients", "content", "roles", "settings"];
  const first = ordered.find((permission) => permissions.includes(permission));
  return first ? DEFAULT_ADMIN_PATHS[first] : "/admin/login";
}
