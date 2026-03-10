export interface User {
    id: number;
    email: string;
    username: string;
    role: 'user' | 'admin';
}

export function getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('masm_user');
    return data ? JSON.parse(data) : null;
}

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('masm_token');
}

export function setAuth(token: string, user: User) {
    localStorage.setItem('masm_token', token);
    localStorage.setItem('masm_user', JSON.stringify(user));
}

export function clearAuth() {
    localStorage.removeItem('masm_token');
    localStorage.removeItem('masm_user');
}

export const logout = clearAuth;

export function isAdmin(): boolean {
    const user = getUser();
    return user?.role === 'admin';
}

export function isAuthenticated(): boolean {
    return !!getToken();
}
