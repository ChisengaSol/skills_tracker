import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import supabase from "@/lib/supabase";

type AuthContextType = {
  session: Session | null | undefined;
  setSession: React.Dispatch<React.SetStateAction<Session | null | undefined>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthContextProviderProps = {
  children: ReactNode;
};

function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContextProvider;
export { AuthContext };