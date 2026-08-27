import { Role } from "@prisma/client";

export type AuthUser = { role: Role } | null | undefined;

export function hasRole(user: AuthUser, role: Role): boolean {
  return user?.role === role;
}

const ADMIN_ONLY_PREFIXES = ["/admin"];

export function canAccessRoute(user: AuthUser, pathname: string): boolean {
  const isAdminRoute = ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isAdminRoute) {
    return hasRole(user, Role.ADMIN);
  }
  return true;
}
