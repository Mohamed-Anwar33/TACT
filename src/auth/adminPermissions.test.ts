import { describe, expect, it } from "vitest";
import {
  canAccessAdminPath,
  getAdminPermissions,
  hasAdminPermission,
  isStaff,
} from "./adminPermissions";

describe("adminPermissions", () => {
  it("keeps admin as the only full-access role", () => {
    const roles = ["admin"];

    expect(isStaff(roles)).toBe(true);
    expect(getAdminPermissions(roles)).toEqual(expect.arrayContaining(["dashboard", "content", "clients", "roles", "settings"]));
    expect(canAccessAdminPath(roles, "/admin/roles")).toBe(true);
    expect(canAccessAdminPath(roles, "/admin/pages/home")).toBe(true);
    expect(canAccessAdminPath(roles, "/admin/questionnaires")).toBe(true);
  });

  it("allows manager to access content and client follow-up without role administration", () => {
    const roles = ["manager"];

    expect(hasAdminPermission(roles, "content")).toBe(true);
    expect(hasAdminPermission(roles, "clients")).toBe(true);
    expect(hasAdminPermission(roles, "roles")).toBe(false);
    expect(canAccessAdminPath(roles, "/admin/packages")).toBe(true);
    expect(canAccessAdminPath(roles, "/admin/unlocks")).toBe(true);
    expect(canAccessAdminPath(roles, "/admin/roles")).toBe(false);
  });

  it("limits client_followup to client data routes", () => {
    const roles = ["client_followup"];

    expect(isStaff(roles)).toBe(true);
    expect(hasAdminPermission(roles, "clients")).toBe(true);
    expect(hasAdminPermission(roles, "content")).toBe(false);
    expect(canAccessAdminPath(roles, "/admin/contact")).toBe(true);
    expect(canAccessAdminPath(roles, "/admin/selections")).toBe(true);
    expect(canAccessAdminPath(roles, "/admin/questionnaires")).toBe(true);
    expect(canAccessAdminPath(roles, "/admin/pages/home")).toBe(false);
    expect(canAccessAdminPath(roles, "/admin/projects")).toBe(false);
  });

  it("limits technical_office to content routes", () => {
    const roles = ["technical_office"];

    expect(hasAdminPermission(roles, "content")).toBe(true);
    expect(hasAdminPermission(roles, "clients")).toBe(false);
    expect(canAccessAdminPath(roles, "/admin/services")).toBe(true);
    expect(canAccessAdminPath(roles, "/admin/team")).toBe(true);
    expect(canAccessAdminPath(roles, "/admin/unlocks")).toBe(false);
    expect(canAccessAdminPath(roles, "/admin/contact")).toBe(false);
  });

  it("does not allow normal customers into admin routes", () => {
    const roles = ["customer"];

    expect(isStaff(roles)).toBe(false);
    expect(getAdminPermissions(roles)).toEqual([]);
    expect(canAccessAdminPath(roles, "/admin")).toBe(false);
    expect(canAccessAdminPath(roles, "/admin/questionnaires")).toBe(false);
  });

  it("keeps office_consultant out of admin routes", () => {
    const roles = ["office_consultant"];

    expect(isStaff(roles)).toBe(false);
    expect(getAdminPermissions(roles)).toEqual([]);
    expect(canAccessAdminPath(roles, "/admin")).toBe(false);
    expect(canAccessAdminPath(roles, "/admin/selections")).toBe(false);
  });
});
