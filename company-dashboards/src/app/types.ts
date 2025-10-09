import { ReactNode } from 'react';

export interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
}

export interface DashboardCard {
    title: string;
    description: string;
    href: string;
    icon: ReactNode;
    color: string;
    bgGradient: string;
    borderColor: string;
}