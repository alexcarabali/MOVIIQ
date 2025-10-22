"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (redirect?: string) => void;
  logout: (redirect?: string) => void;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Cargar estado desde localStorage al iniciar
  useEffect(() => {
    const stored = localStorage.getItem("isAuthenticated");
    if (stored === "true") setIsAuthenticated(true);
  }, []);

  const login = (redirect?: string) => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");

    if (redirect && typeof redirect === "string" && redirect.length > 0) {
      router.push(redirect);
    }
  };

  const logout = (redirect?: string) => {
    setIsAuthenticated(false);
    localStorage.setItem("isAuthenticated", "false");

    if (redirect && typeof redirect === "string" && redirect.length > 0) {
      router.push(redirect);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar AuthContext
export const useAuth = () => useContext(AuthContext);
