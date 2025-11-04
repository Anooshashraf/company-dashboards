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


// types/ias.ts
export interface IASReport {
    Region: string;
    Market: string;
    'Sub Market': string;
    'Store Name': string;
    'Store Address': string;
    Status: string;
    SKU: string;
    Model: string;
    Product: string;
    INSTOCK: string;
    'ON TRANSFER': string;
    'IN Transit': string;
    BACKDATED: string;
    Friday: string;
    Monday: string;
    GROUND: string;
    TOTAL: string;
    Cost: string;
    QUOTA: string;
    '2days': string;
    LWS: string;
    L2WS: string;
    L3WS: string;
    L4WS: string;
    L5WS: string;
    'New Activation': string;
    SWITCHER: string;
    UPGRADE: string;
    '3W ACT': string;
    '3W UPG': string;
    '%': string;
    'SUG QTY': string;
    'OVERNIGHT QTY': string;
    '2nd DAY': string;
    'GROUND QTY': string;
    ALLOCATION: string;
    'Total ACC Sale': string;
    PPD: string;
    'ACC Per BOX': string;
    'TOTAL COST': string;
    '#': string;
    ID: string;
    'Net Worth': string;
}