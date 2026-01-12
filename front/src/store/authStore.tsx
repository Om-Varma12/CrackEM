import { AuthState } from "@/types/authStore";
import { create } from "zustand";
import { persist } from "zustand/middleware";


export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            user: null,

            login: (user) =>
                set({
                    isAuthenticated: true,
                    user,
                }),

            logout: () =>
                set({
                    isAuthenticated: false,
                    user: null,
                }),
        }),
        {
            name: "auth-storage",
        }
    )
);
