export const validateUser = (email: string, password: string): boolean => {
    const allowedEmail = 'admin@company.com';
    const defaultPassword = 'company123';

    return email === allowedEmail && password === defaultPassword;
};

export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('isAuthenticated') === 'true';
};

export const login = (): void => {
    localStorage.setItem('isAuthenticated', 'true');
};

export const logout = (): void => {
    localStorage.removeItem('isAuthenticated');
};