export interface User {
    name: string;
    email: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
}
