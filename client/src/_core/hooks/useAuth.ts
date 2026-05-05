import { useCallback } from "react";

// Auth deshabilitado: usuario invitado siempre autenticado
const GUEST_USER = {
  id: 1,
  openId: "guest",
  name: "Usuario",
  email: "usuario@local.app",
  avatarUrl: null,
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(_options?: UseAuthOptions) {
  const logout = useCallback(async () => {
    // Sin autenticación, el logout no hace nada
  }, []);

  return {
    user: GUEST_USER,
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: () => Promise.resolve(),
    logout,
  };
}
