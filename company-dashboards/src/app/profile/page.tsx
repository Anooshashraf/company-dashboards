'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import './profile.css';


interface User {
    email: string;
    password: string;
    role: string;
}

interface ProfileForm {
    name: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export default function ProfilePage() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="profile-page">
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your personal information and security settings</p>
            </div>

            <div className="profile-content-single">
                <MyProfileSection user={user} />
            </div>
        </div>
    );
}

// My Profile Component - Only shows current user's info
const MyProfileSection: React.FC<{ user: any }> = ({ user }) => {
    const { updateUserPassword } = useAuth();
    const [profile, setProfile] = useState({
        name: "",
        email: user.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [isEditing, setIsEditing] = useState(false);

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();

        if (profile.newPassword !== profile.confirmPassword) {
            alert("New passwords don't match!");
            return;
        }

        if (profile.currentPassword !== user.password) {
            alert("Current password is incorrect!");
            return;
        }

        // Update password
        updateUserPassword(profile.newPassword);
        alert('Password changed successfully!');

        setProfile(prev => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        }));
        setIsEditing(false);
    };

    return (
        <div className="profile-section">
            {/* Current User Information */}
            <div className="profile-card">
                <h3>Account Information</h3>
                <div className="user-info-display">
                    <div className="info-item">
                        <label>Email Address</label>
                        <div className="info-value">{user.email}</div>
                    </div>
                    <div className="info-item">
                        <label>Role</label>
                        <div className="info-value role-badge">{user.role}</div>
                    </div>
                    <div className="info-item">
                        <label>Current Password</label>
                        <div className="info-value password-masked">
                            {user.password}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn-primary"
                >
                    {isEditing ? 'Cancel Password Change' : 'Change Password'}
                </button>
            </div>

            {/* Change Password Form - Only shown when editing */}
            {isEditing && (
                <div className="profile-card">
                    <h3>Change Password</h3>
                    <form onSubmit={handlePasswordChange} className="profile-form">
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={profile.currentPassword}
                                onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                                placeholder="Enter current password"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={profile.newPassword}
                                onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                                placeholder="Enter new password"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={profile.confirmPassword}
                                onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                                placeholder="Confirm new password"
                                required
                                minLength={6}
                            />
                        </div>
                        <button type="submit" className="btn-primary">Update Password</button>
                    </form>
                </div>
            )}

            {/* Security Notes */}
            <div className="profile-card">
                <h3>Security Tips</h3>
                <div className="security-tips">
                    <p>• Use a strong, unique password</p>
                    <p>• Never share your password with anyone</p>
                    <p>• Change your password regularly</p>
                    <p>• Contact administrator for any account issues</p>
                </div>
            </div>
        </div>
    );
};









// 'use client';
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../components/AuthProvider';
// import { useRouter } from 'next/navigation';
// import './profile.css';

// // Define proper TypeScript interfaces
// interface User {
//     email: string;
//     password: string;
//     role: string;
// }

// interface ProfileForm {
//     name: string;
//     email: string;
//     currentPassword: string;
//     newPassword: string;
//     confirmPassword: string;
// }

// export default function ProfilePage() {
//     const { isAuthenticated, isLoading, user } = useAuth();
//     const router = useRouter();

//     // Redirect if not authenticated
//     useEffect(() => {
//         if (!isLoading && !isAuthenticated) {
//             router.push('/login');
//         }
//     }, [isAuthenticated, isLoading, router]);

//     if (isLoading) {
//         return (
//             <div className="profile-page">
//                 <div style={{ textAlign: 'center', color: 'white' }}>
//                     <div className="loading-spinner"></div>
//                     <p>Loading...</p>
//                 </div>
//             </div>
//         );
//     }

//     if (!isAuthenticated || !user) {
//         return null;
//     }

//     return (
//         <div className="profile-page">
//             <div className="profile-header">
//                 <h1>My Profile</h1>
//                 <p>Manage your personal information and security settings</p>
//             </div>

//             <div className="profile-content-single">
//                 <MyProfileSection user={user} />
//             </div>
//         </div>
//     );
// }

// // My Profile Component - Only shows current user's info
// const MyProfileSection: React.FC<{ user: User }> = ({ user }) => {
//     const { updateUserPassword } = useAuth();
//     const [profile, setProfile] = useState<ProfileForm>({
//         name: "",
//         email: user.email,
//         currentPassword: "",
//         newPassword: "",
//         confirmPassword: ""
//     });

//     const [isEditing, setIsEditing] = useState(false);

//     const handlePasswordChange = (e: React.FormEvent) => {
//         e.preventDefault();

//         if (profile.newPassword !== profile.confirmPassword) {
//             alert("New passwords don&apos;t match!");
//             return;
//         }

//         if (profile.currentPassword !== user.password) {
//             alert("Current password is incorrect!");
//             return;
//         }

//         // Update password
//         updateUserPassword(profile.newPassword);
//         alert('Password changed successfully!');

//         setProfile(prev => ({
//             ...prev,
//             currentPassword: "",
//             newPassword: "",
//             confirmPassword: ""
//         }));
//         setIsEditing(false);
//     };

//     // Function to mask password for display
//     const maskPassword = (password: string): string => {
//         return '•'.repeat(password.length);
//     };

//     return (
//         <div className="profile-section">
//             {/* Current User Information */}
//             <div className="profile-card">
//                 <h3>Account Information</h3>
//                 <div className="user-info-display">
//                     <div className="info-item">
//                         <label>Email Address</label>
//                         <div className="info-value">{user.email}</div>
//                     </div>
//                     <div className="info-item">
//                         <label>Role</label>
//                         <div className="info-value role-badge">{user.role}</div>
//                     </div>
//                     <div className="info-item">
//                         <label>Current Password</label>
//                         <div className="info-value password-masked">
//                             {maskPassword(user.password)}
//                         </div>
//                     </div>
//                 </div>

//                 <button
//                     onClick={() => setIsEditing(!isEditing)}
//                     className="btn-primary"
//                 >
//                     {isEditing ? 'Cancel Password Change' : 'Change Password'}
//                 </button>
//             </div>

//             {/* Change Password Form - Only shown when editing */}
//             {isEditing && (
//                 <div className="profile-card">
//                     <h3>Change Password</h3>
//                     <form onSubmit={handlePasswordChange} className="profile-form">
//                         <div className="form-group">
//                             <label>Current Password</label>
//                             <input
//                                 type="password"
//                                 value={profile.currentPassword}
//                                 onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
//                                 placeholder="Enter current password"
//                                 required
//                             />
//                         </div>
//                         <div className="form-group">
//                             <label>New Password</label>
//                             <input
//                                 type="password"
//                                 value={profile.newPassword}
//                                 onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
//                                 placeholder="Enter new password"
//                                 required
//                                 minLength={6}
//                             />
//                         </div>
//                         <div className="form-group">
//                             <label>Confirm New Password</label>
//                             <input
//                                 type="password"
//                                 value={profile.confirmPassword}
//                                 onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
//                                 placeholder="Confirm new password"
//                                 required
//                                 minLength={6}
//                             />
//                         </div>
//                         <button type="submit" className="btn-primary">Update Password</button>
//                     </form>
//                 </div>
//             )}

//             {/* Security Notes */}
//             <div className="profile-card">
//                 <h3>Security Tips</h3>
//                 <div className="security-tips">
//                     <p>• Use a strong, unique password</p>
//                     <p>• Never share your password with anyone</p>
//                     <p>• Change your password regularly</p>
//                     <p>• Contact administrator for any account issues</p>
//                 </div>
//             </div>
//         </div>
//     );
// };