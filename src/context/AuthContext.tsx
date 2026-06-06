import { createContext, useState } from "react";
import type { ReactNode } from "react";

type AuthContextType = {
  session: string | undefined;
  setSession: React.Dispatch<React.SetStateAction<string | undefined>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthContextProviderProps = {
  children: ReactNode;
};

function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [session, setSession] = useState<string | undefined>(undefined);

  return (
    <AuthContext.Provider value={{ session, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContextProvider;
export { AuthContext };