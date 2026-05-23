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
    let isMounted = true;
    let initialCheckDone = false;

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      if (!isMounted) return;
      
      if (initSession?.user) {
        setSession(initSession);
        setUser(initSession.user);
        loadExtras(initSession.user.id).finally(() => {
          if (isMounted) {
            initialCheckDone = true;
          }
        });
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsStaff(false);
        setRoles([]);
        initialCheckDone = true;
        setLoading(false);
      }
    });

    // 2. Listen to subsequent auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      // Skip the initial callback of onAuthStateChange if getSession hasn't finished yet
      // to prevent setting loading to false with a brief null state.
      if (!initialCheckDone && !newSession?.user) {
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        setLoading(true);
        loadExtras(newSession.user.id).finally(() => {
          if (isMounted) {
            initialCheckDone = true;
          }
        });
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsStaff(false);
        setRoles([]);
        // Only set loading to false if we're not waiting for an initial getSession check
        if (initialCheckDone) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
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
