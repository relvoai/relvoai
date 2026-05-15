import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserResource } from '../../types';

interface AuthState {
    token: string | null;
    user: UserResource | null;
    isAuthenticated: boolean;
}

interface AuthActions {
    loginSuccess: (token: string, user: UserResource) => void;
    logout: () => void;
    setUser: (user: UserResource) => void;
}

type AuthStore = AuthState & AuthActions;

/**
 * Zustand auth store with localStorage persistence
 * Per .ai/contracts/update.json:
 * - token, user, isAuthenticated fields
 * - loginSuccess, logout, setUser actions
 */
export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            // State
            token: null,
            user: null,
            isAuthenticated: false,

            // Actions
            loginSuccess: (token: string, user: UserResource) =>
                set({
                    token,
                    user,
                    isAuthenticated: true,
                }),

            logout: () =>
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                }),

            setUser: (user: UserResource) =>
                set({
                    user,
                }),
        }),
        {
            name: 'relvoai-auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;
