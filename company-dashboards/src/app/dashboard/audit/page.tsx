'use client';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuditDashboard() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Dashboard</h1>
                <p className="text-gray-600">Audit reports and compliance tracking</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Audits</h3>
                    <p className="text-3xl font-bold text-green-600">456</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-yellow-500">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">In Progress</h3>
                    <p className="text-3xl font-bold text-yellow-600">23</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Completed</h3>
                    <p className="text-3xl font-bold text-blue-600">433</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Audit Overview</h3>
                <p className="text-gray-600">Audit dashboard content and reports will be displayed here.</p>
            </div>
        </div>
    );
}