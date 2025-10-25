'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppSettings {
    theme: 'dark' | 'light';
    language: 'en' | 'es' | 'ur';
    exportFormat: 'csv' | 'excel' | 'pdf';
}

export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    language: 'en',
    exportFormat: 'csv'
};

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    // Load settings
    useEffect(() => {
        const saved = localStorage.getItem('app-settings');
        if (saved) {
            try {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
            } catch (error) {
                console.log('Using default settings');
            }
        }
    }, []);

    // Save settings
    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('app-settings', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};