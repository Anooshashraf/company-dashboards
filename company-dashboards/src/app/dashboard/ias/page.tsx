'use client';
import React, { useState } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Mock data for IAS reports
const mockReports = [
    {
        id: 1,
        title: 'Q1 2024 Inventory Audit',
        department: 'Warehouse',
        status: 'Completed',
        date: '2024-03-15',
        auditor: 'John Smith',
        findings: 12,
        critical: 2,
        score: 85
    },
    {
        id: 2,
        title: 'Supplier Compliance Review',
        department: 'Procurement',
        status: 'In Progress',
        date: '2024-03-20',
        auditor: 'Sarah Johnson',
        findings: 8,
        critical: 1,
        score: 92
    },
    {
        id: 3,
        title: 'Asset Management Audit',
        department: 'Finance',
        status: 'Pending',
        date: '2024-04-01',
        auditor: 'Mike Chen',
        findings: 0,
        critical: 0,
        score: 0
    },
    {
        id: 4,
        title: 'IT Security Assessment',
        department: 'IT',
        status: 'Completed',
        date: '2024-02-28',
        auditor: 'Lisa Wang',
        findings: 15,
        critical: 3,
        score: 78
    }
];

export default function IASReportsPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState(mockReports);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const filteredReports = reports.filter(report => {
        const matchesFilter = filter === 'all' || report.status.toLowerCase() === filter;
        const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.department.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-500';
            case 'in progress': return 'bg-yellow-500';
            case 'pending': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-400';
        if (score >= 80) return 'text-yellow-400';
        if (score >= 70) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">IAS Reports</h1>
                    <p className="text-gray-400">Internal Audit System Reports and Analytics</p>
                </div>

                {/* Filters and Search */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                All Reports
                            </button>
                            <button
                                onClick={() => setFilter('completed')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                Completed
                            </button>
                            <button
                                onClick={() => setFilter('in progress')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'in progress' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                In Progress
                            </button>
                            <button
                                onClick={() => setFilter('pending')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'pending' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                Pending
                            </button>
                        </div>

                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                            <div className="absolute right-3 top-2.5 text-gray-400">
                                🔍
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Total Reports</div>
                        <div className="text-2xl font-bold text-white">{reports.length}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Completed</div>
                        <div className="text-2xl font-bold text-green-400">
                            {reports.filter(r => r.status === 'Completed').length}
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Critical Findings</div>
                        <div className="text-2xl font-bold text-red-400">
                            {reports.reduce((sum, report) => sum + report.critical, 0)}
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Avg. Score</div>
                        <div className="text-2xl font-bold text-yellow-400">
                            {Math.round(reports.filter(r => r.score > 0).reduce((sum, report) => sum + report.score, 0) / reports.filter(r => r.score > 0).length) || 0}%
                        </div>
                    </div>
                </div>

                {/* Reports Table */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-700">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Report
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Findings
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-750 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-white">{report.title}</div>
                                                <div className="text-sm text-gray-400">
                                                    {report.date} • {report.auditor}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {report.department}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)} text-white`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <span>{report.findings} total</span>
                                                {report.critical > 0 && (
                                                    <span className="text-red-400 font-medium">
                                                        ({report.critical} critical)
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-bold ${getScoreColor(report.score)}`}>
                                                {report.score > 0 ? `${report.score}%` : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button className="text-blue-400 hover:text-blue-300 transition-colors">
                                                    View
                                                </button>
                                                <button className="text-green-400 hover:text-green-300 transition-colors">
                                                    Export
                                                </button>
                                                {report.status === 'Pending' && (
                                                    <button className="text-yellow-400 hover:text-yellow-300 transition-colors">
                                                        Start Audit
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredReports.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            No reports found matching your criteria.
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 flex gap-4">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium">
                        + Create New Report
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium">
                        📊 Generate Summary
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium">
                        📥 Export All
                    </button>
                </div>
            </div>
        </div>
    );
}