// 'use client';
// import React, { createContext, useContext, useState, useEffect } from 'react';

// export interface AppSettings {
//     theme: 'dark' | 'light';
//     language: 'en' | 'es' | 'ur';
//     exportFormat: 'csv' | 'excel' | 'pdf';
// }

// export const DEFAULT_SETTINGS: AppSettings = {
//     theme: 'dark',
//     language: 'en',
//     exportFormat: 'csv'
// };

// interface SettingsContextType {
//     settings: AppSettings;
//     updateSettings: (newSettings: Partial<AppSettings>) => void;
// }

// const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

//     // Load settings
//     useEffect(() => {
//         const saved = localStorage.getItem('app-settings');
//         if (saved) {
//             try {
//                 setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
//             } catch (error) {
//                 console.log('Using default settings');
//             }
//         }
//     }, []);

//     // Save settings
//     const updateSettings = (newSettings: Partial<AppSettings>) => {
//         setSettings(prev => {
//             const updated = { ...prev, ...newSettings };
//             localStorage.setItem('app-settings', JSON.stringify(updated));
//             return updated;
//         });
//     };

//     return (
//         <SettingsContext.Provider value={{ settings, updateSettings }}>
//             {children}
//         </SettingsContext.Provider>
//     );
// };

// export const useSettings = () => {
//     const context = useContext(SettingsContext);
//     if (!context) throw new Error('useSettings must be used within SettingsProvider');
//     return context;
// };



'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppSettings {
    theme: 'light' | 'dark';
    language: 'en' | 'es' | 'ur';
    export: ExportSettings;
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
        exportLocation: 'downloads'
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

    // SAFE theme application - ONLY changes colors, NEVER layout
    const applyTheme = (theme: 'light' | 'dark') => {
        const root = document.documentElement;

        if (theme === 'light') {
            // Light theme - ONLY color changes
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
        } else {
            // Dark theme - ONLY color changes (your original theme)
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
        }

        // CRITICAL: Layout variables are NEVER changed - your centered layout stays perfect
    };

    // Load settings from localStorage on mount
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

    // Save settings to localStorage when they change
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