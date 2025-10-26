'use client';
import React, { useState } from 'react';
import { useSettings } from '../SettingsContext';
import './settings.css';

export default function SettingsPage() {
    const { settings, updateSettings, resetSettings, isModified } = useSettings();
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: '⚙️' },
        { id: 'export', label: 'Export', icon: '📤' }
    ];

    const handleSettingChange = (category: string, updates: any) => {
        if (category === 'general') {
            updateSettings(updates);
        } else {
            updateSettings({
                [category]: { ...(settings as any)[category], ...updates }
            } as any);
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <span className=''>
                    <h1>Settings</h1>
                    <p>Customize your audit dashboard experience</p>
                </span>
            </div>

            <div className="settings-layout">
                <div className="settings-sidebar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}

                    <div className="settings-actions">
                        <button
                            className="btn-reset"
                            onClick={resetSettings}
                            disabled={!isModified}
                        >
                            Reset to Defaults
                        </button>
                    </div>
                </div>

                <div className="settings-content">
                    {activeTab === 'general' && (
                        <GeneralSettings
                            settings={settings}
                            onChange={(updates) => handleSettingChange('general', updates)}
                        />
                    )}

                    {activeTab === 'export' && (
                        <ExportSettings
                            settings={settings.export}
                            onChange={(updates) => handleSettingChange('export', updates)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// General Settings - Only Theme & Language
const GeneralSettings: React.FC<{
    settings: any;
    onChange: (updates: any) => void;
}> = ({ settings, onChange }) => {
    const themes = [
        {
            id: 'dark' as const,
            name: 'Dark',
            description: 'Default dark theme'
        },
        {
            id: 'light' as const,
            name: 'Light',
            description: 'Light theme'
        }
    ];

    const languages = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español' },
        { value: 'ur', label: 'Urdu' }
    ];

    return (
        <div className="settings-section">
            <h2>General Settings</h2>

            <div className="setting-group">
                <label>Theme</label>
                <div className="theme-previews">
                    {themes.map(theme => (
                        <div
                            key={theme.id}
                            className={`theme-preview ${settings.theme === theme.id ? 'active' : ''}`}
                            onClick={() => onChange({ theme: theme.id })}
                            data-theme={theme.id}
                        >
                            <div className="theme-preview-content">
                                <div className="theme-name">{theme.name}</div>
                                <div className="theme-description">{theme.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="current-theme">
                    Current: <span>{themes.find(t => t.id === settings.theme)?.name}</span>
                </div>
            </div>

            <div className="setting-group">
                <label htmlFor="language">Language</label>
                <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => onChange({ language: e.target.value })}
                >
                    {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>
                            {lang.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

// Export Settings
const ExportSettings: React.FC<{
    settings: any;
    onChange: (updates: any) => void;
}> = ({ settings, onChange }) => (
    <div className="settings-section">
        <h2>Export Settings</h2>

        <div className="setting-group">
            <label htmlFor="defaultFormat">Default Export Format</label>
            <select
                id="defaultFormat"
                value={settings.defaultFormat}
                onChange={(e) => onChange({ defaultFormat: e.target.value })}
            >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
            </select>
        </div>

        <div className="setting-group">
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    checked={settings.includeHeaders}
                    onChange={(e) => onChange({ includeHeaders: e.target.checked })}
                />
                Include Headers in Exports
            </label>
        </div>

        <div className="setting-group">
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    checked={settings.compressExports}
                    onChange={(e) => onChange({ compressExports: e.target.checked })}
                />
                Compress Export Files
            </label>
        </div>
    </div>
);