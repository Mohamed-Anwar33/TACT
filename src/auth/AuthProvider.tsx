import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAdminPermissions, isStaff as hasStaffRole } from "@/auth/adminPermissions";

type Profile = { id: string; full_name: string | null; phone: string | null; email: string | null; packages_unlocked: boolean };

type Ctx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isStaff: boolean;
  roles: string[];
  canManageContent: boolean;
  canManageClients: boolean;
  canManageRoles: boolean;
  canManageSettings: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({} as Ctx);

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExtras = async (uid: string) => {
    setLoading(true);
    try {
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      const roleList = roles?.map((r: any) => String(r.role)) ?? [];
      setProfile(p as Profile | null);
      setRoles(roleList);
      setIsAdmin(roleList.includes("admin"));
      setIsStaff(hasStaffRole(roleList));
    } catch (e) {
      console.error("Error loading profile or roles:", e);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (user) await loadExtras(user.id);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setLoading(true);
        setTimeout(() => {
          loadExtras(s.user.id);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsStaff(false);
        setRoles([]);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadExtras(session.user.id);
      } else {
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };
  const permissions = getAdminPermissions(roles);
  const canManageContent = permissions.includes("content");
  const canManageClients = permissions.includes("clients");
  const canManageRoles = permissions.includes("roles");
  const canManageSettings = permissions.includes("settings");

  return (
    <AuthCtx.Provider value={{ user, session, profile, isAdmin, isStaff, roles, canManageContent, canManageClients, canManageRoles, canManageSettings, loading, refresh, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}
