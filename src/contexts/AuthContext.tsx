import React, { createContext, useContext, useEffect, useState } from "react";
import { User, api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    username: string,
    password: string,
    tenantId?: number,
  ) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");
      const demoMode = localStorage.getItem("demo_mode");

      console.log("AuthProvider: Initializing auth", {
        token: !!token,
        demoMode,
      });

      if (token) {
        try {
          const currentUser = await api.getCurrentUser();
          console.log("AuthProvider: Current user loaded", currentUser);
          setUser(currentUser);
        } catch (error) {
          console.error("AuthProvider: Failed to load current user", error);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("demo_mode");
          localStorage.removeItem("user_type");
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (
    username: string,
    password: string,
    tenantId?: number,
  ) => {
    try {
      console.log("AuthProvider: Login attempt", { username, tenantId });

      const loginData: any = { username, password };
      if (tenantId) {
        loginData.tenant_id = tenantId;
      }

      const response = await api.login(loginData);
      console.log("AuthProvider: Login successful", response);

      setUser(response.user);
    } catch (error) {
      console.error("AuthProvider: Login failed", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("AuthProvider: Logout error", error);
    } finally {
      setUser(null);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("user_type");
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
