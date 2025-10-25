'use client';
import React, { useState } from 'react';
import { useSettings } from '../SettingsContext';
import './settings.css';

export default function SettingsPage() {
    const { settings, updateSettings } = useSettings();
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your application preferences</p>
            </div>

            <div className="settings-layout">
                {/* Sidebar */}
                <div className="settings-sidebar">
                    <button
                        className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        ⚙️ General
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'export' ? 'active' : ''}`}
                        onClick={() => setActiveTab('export')}
                    >
                        📤 Export
                    </button>
                </div>

                {/* Content */}
                <div className="settings-content">
                    {activeTab === 'general' && <GeneralSettings settings={settings} onChange={updateSettings} />}
                    {activeTab === 'export' && <ExportSettings settings={settings} onChange={updateSettings} />}
                </div>
            </div>
        </div>
    );
}

// General Settings Component
const GeneralSettings = ({ settings, onChange }: {
    settings: any;
    onChange: (updates: any) => void;
}) => (
    <div className="settings-section">
        <h2>General Settings</h2>

        <div className="setting-group">
            <label>Theme</label>
            <select
                value={settings.theme}
                onChange={(e) => onChange({ theme: e.target.value })}
            >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
            </select>
        </div>

        <div className="setting-group">
            <label>Language</label>
            <select
                value={settings.language}
                onChange={(e) => onChange({ language: e.target.value })}
            >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="ur">Urdu</option>
            </select>
        </div>
    </div>
);

// Export Settings Component
const ExportSettings = ({ settings, onChange }: {
    settings: any;
    onChange: (updates: any) => void;
}) => (
    <div className="settings-section">
        <h2>Export Settings</h2>

        <div className="setting-group">
            <label>Default Format</label>
            <select
                value={settings.exportFormat}
                onChange={(e) => onChange({ exportFormat: e.target.value })}
            >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
            </select>
        </div>
    </div>
);