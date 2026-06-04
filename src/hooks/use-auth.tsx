import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, setToken, removeToken } from "@/lib/api";
import type { ApiUser } from "@/lib/api";
import { unregisterPushNotifications } from "@/lib/firebase";

interface AuthContextType {
  user: ApiUser | null;
  loading: boolean;
  setUser: (user: ApiUser | null) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("rw_token") : null;
    if (!token) { setLoading(false); return; }

    api.get<{ user: ApiUser }>("/api/auth/me")
      .then(({ user }) => setUser(user))
      .catch(() => removeToken())
      .finally(() => setLoading(false));
  }, []);

  const signOut = () => {
    unregisterPushNotifications().catch(() => {});
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { setToken };
export type { ApiUser };
