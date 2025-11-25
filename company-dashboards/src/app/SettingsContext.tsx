'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppSettings {
    theme: 'light' | 'dark';
    language: 'en' | 'es' | 'ur';
    export: {
        defaultFormat: 'csv' | 'excel' | 'pdf';
        includeHeaders: boolean;
        compressExports: boolean;
    };
}

export interface ExportSettings {
    defaultFormat: 'csv' | 'excel' | 'pdf';
    includeHeaders: boolean;
    compressExports: boolean;
    exportLocation: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    language: 'en',
    export: {
        defaultFormat: 'csv',
        includeHeaders: true,
        compressExports: false,
        // exportLocation: 'downloads';
    }
};

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    resetSettings: () => void;
    isModified: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isModified, setIsModified] = useState(false);
    const applyTheme = (theme: 'light' | 'dark') => {
        const root = document.documentElement;

        // mark the document with the current theme so CSS can target it directly
        try {
            root.setAttribute('data-theme', theme);
        } catch (e) {
            /* noop - defensive */
        }

        if (theme === 'light') {

            root.style.setProperty('--bg-primary', '#f8fafc');
            root.style.setProperty('--bg-secondary', '#f1f5f9');
            root.style.setProperty('--bg-tertiary', '#e2e8f0');
            root.style.setProperty('--text-primary', '#1e293b');
            root.style.setProperty('--text-secondary', '#475569');
            root.style.setProperty('--text-muted', '#64748b');
            root.style.setProperty('--border', '#cbd5e1');
            root.style.setProperty('--glass', 'rgba(255, 255, 255, 0.8)');
            root.style.setProperty('--glass-dark', 'rgba(248, 250, 252, 0.9)');
            root.style.setProperty('--glass-light', 'rgba(241, 245, 249, 0.6)');
            /* Age-badge tokens for light theme (darker foreground for contrast) */
            root.style.setProperty('--age-7-bg-rgb', '141,41,41');
            root.style.setProperty('--age-7-fg', '#7b1f1f');
            root.style.setProperty('--age-14-bg-rgb', '245,158,11');
            root.style.setProperty('--age-14-fg', '#b45309');
            root.style.setProperty('--age-14plus-bg-rgb', '67,221,149');
            root.style.setProperty('--age-14plus-fg', '#065f46');
            root.style.setProperty('--age-empty-bg', 'rgba(0,0,0,0.04)');
            root.style.setProperty('--age-empty-fg', '#1e293b');
        } else {
            root.style.setProperty('--bg-primary', '#0f172a');
            root.style.setProperty('--bg-secondary', '#1e293b');
            root.style.setProperty('--bg-tertiary', '#334155');
            root.style.setProperty('--text-primary', '#f1f5f9');
            root.style.setProperty('--text-secondary', '#cbd5e1');
            root.style.setProperty('--text-muted', '#94a3b8');
            root.style.setProperty('--border', '#334155');
            root.style.setProperty('--glass', 'rgba(30, 41, 59, 0.8)');
            root.style.setProperty('--glass-dark', 'rgba(15, 23, 42, 0.9)');
            root.style.setProperty('--glass-light', 'rgba(51, 65, 85, 0.6)');
            /* Age-badge tokens for dark theme (lighter foreground for contrast) */
            root.style.setProperty('--age-7-bg-rgb', '141,41,41');
            root.style.setProperty('--age-7-fg', '#ffb3b3');
            root.style.setProperty('--age-14-bg-rgb', '245,158,11');
            root.style.setProperty('--age-14-fg', '#ffd27a');
            root.style.setProperty('--age-14plus-bg-rgb', '67,221,149');
            root.style.setProperty('--age-14plus-fg', '#b7f7cf');
            root.style.setProperty('--age-empty-bg', 'rgba(255,255,255,0.03)');
            root.style.setProperty('--age-empty-fg', '#e6e6e6');
        }
    };

    useEffect(() => {
        const savedSettings = localStorage.getItem('audit-app-settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                const loadedSettings = {
                    ...DEFAULT_SETTINGS,
                    ...parsed
                } as AppSettings;

                setSettings(loadedSettings);
                applyTheme(loadedSettings.theme);
            } catch (error) {
                console.error('Failed to load settings:', error);
                applyTheme(DEFAULT_SETTINGS.theme);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('audit-app-settings', JSON.stringify(settings));
        setIsModified(false);
    }, [settings]);

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => {
            const updated = {
                ...prev,
                ...newSettings
            } as AppSettings;

            if (newSettings.theme && newSettings.theme !== prev.theme) {
                applyTheme(newSettings.theme);
            }

            return updated;
        });
        setIsModified(true);
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
        applyTheme(DEFAULT_SETTINGS.theme);
        setIsModified(false);
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSettings,
            resetSettings,
            isModified
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};








