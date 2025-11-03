// 'use client';
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../components/AuthProvider';
// import { useRouter } from 'next/navigation';
// import './profile.css';

// // Default users
// const DEFAULT_USERS = [
//     { email: "inventory_active8@gmail.com", password: "inventory123", role: "Administrator" },
//     { email: "fahad@techno-communications.com", password: "fahad123", role: "Manager" },
//     { email: "GHANI@TEXASMOBILEPCS.COM", password: "ghani123", role: "Auditor" },
//     { email: "aleem.ghori@techno-communications.com", password: "aleem123", role: "Analyst" },
//     { email: "hasnain.mustaqeem@techno-communications.com", password: "hm123", role: "Viewer" }
// ];

// export default function ProfilePage() {
//     const { isAuthenticated, isLoading } = useAuth();
//     const router = useRouter();
//     const [activeTab, setActiveTab] = useState('users');

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

//     if (!isAuthenticated) {
//         return null;
//     }

//     const tabs = [
//         { id: 'users', label: 'User Management', icon: '👥' },
//         { id: 'myprofile', label: 'My Profile', icon: '👤' }
//     ];

//     return (
//         <div className="profile-page">
//             <div className="profile-header">
//                 <h1>Profile Management</h1>
//                 <p>Manage users and your personal profile settings</p>
//             </div>

//             <div className="profile-layout">
//                 <div className="profile-sidebar">
//                     {tabs.map(tab => (
//                         <button
//                             key={tab.id}
//                             className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
//                             onClick={() => setActiveTab(tab.id)}
//                         >
//                             <span className="tab-icon">{tab.icon}</span>
//                             <span className="tab-label">{tab.label}</span>
//                         </button>
//                     ))}
//                 </div>

//                 <div className="profile-content">
//                     {activeTab === 'users' && <UserManagementSection />}
//                     {activeTab === 'myprofile' && <MyProfileSection />}
//                 </div>
//             </div>
//         </div>
//     );
// }

// // User Management Component
// const UserManagementSection: React.FC = () => {
//     const [users, setUsers] = useState(() => {
//         const savedUsers = localStorage.getItem("inventoryUsers");
//         return savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;
//     });

//     const [newUser, setNewUser] = useState({ email: "", password: "", role: "Viewer" });
//     const [editingUser, setEditingUser] = useState<any>(null);
//     const [searchTerm, setSearchTerm] = useState("");

//     // Save users to localStorage whenever they change
//     useEffect(() => {
//         localStorage.setItem("inventoryUsers", JSON.stringify(users));
//     }, [users]);

//     const handleAddUser = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (newUser.email && newUser.password) {
//             if (users.find((user: any) => user.email.toLowerCase() === newUser.email.toLowerCase())) {
//                 alert("User with this email already exists!");
//                 return;
//             }

//             setUsers((prev: any) => [...prev, newUser]);
//             setNewUser({ email: "", password: "", role: "Viewer" });
//         }
//     };

//     const handleUpdateUser = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (editingUser) {
//             setUsers((prev: any) =>
//                 prev.map((user: any) =>
//                     user.email === editingUser.originalEmail ? { ...editingUser, originalEmail: undefined } : user
//                 )
//             );
//             setEditingUser(null);
//         }
//     };

//     const handleDeleteUser = (email: string) => {
//         if (window.confirm(`Are you sure you want to delete user ${email}?`)) {
//             setUsers((prev: any) => prev.filter((user: any) => user.email !== email));
//         }
//     };

//     const resetToDefault = () => {
//         if (window.confirm("Are you sure you want to reset all users to default? This will remove any custom users you've added.")) {
//             setUsers(DEFAULT_USERS);
//         }
//     };

//     const filteredUsers = users.filter((user: any) =>
//         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user.role.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     return (
//         <div className="profile-section">
//             <h2>User Management</h2>
//             <p className="section-description">Manage user accounts and access permissions for the system</p>

//             {/* Add New User Form */}
//             <div className="profile-card">
//                 <h3>Add New User</h3>
//                 <form onSubmit={handleAddUser} className="user-form">
//                     <div className="form-row">
//                         <input
//                             type="email"
//                             placeholder="Email address"
//                             value={newUser.email}
//                             onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
//                             required
//                         />
//                         <input
//                             type="password"
//                             placeholder="Password"
//                             value={newUser.password}
//                             onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
//                             required
//                         />
//                         <select
//                             value={newUser.role}
//                             onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
//                         >
//                             <option value="Viewer">Viewer</option>
//                             <option value="Analyst">Analyst</option>
//                             <option value="Auditor">Auditor</option>
//                             <option value="Manager">Manager</option>
//                             <option value="Administrator">Administrator</option>
//                         </select>
//                         <button type="submit" className="btn-primary">
//                             Add User
//                         </button>
//                     </div>
//                 </form>
//             </div>

//             {/* Search and Filter */}
//             <div className="profile-card">
//                 <div className="search-container">
//                     <input
//                         type="text"
//                         placeholder="Search users by email or role..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="search-input"
//                     />
//                     <span className="search-icon">🔍</span>
//                 </div>
//             </div>

//             {/* Users List */}
//             <div className="profile-card">
//                 <div className="users-header">
//                     <h3>Existing Users ({filteredUsers.length})</h3>
//                     <button onClick={resetToDefault} className="btn-danger">
//                         Reset to Default
//                     </button>
//                 </div>

//                 <div className="users-list">
//                     {filteredUsers.map((user: any, index: number) => (
//                         <div key={index} className="user-item">
//                             {editingUser?.originalEmail === user.email ? (
//                                 <form onSubmit={handleUpdateUser} className="user-edit-form">
//                                     <input
//                                         type="email"
//                                         value={editingUser.email}
//                                         onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
//                                         required
//                                     />
//                                     <input
//                                         type="password"
//                                         value={editingUser.password}
//                                         onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
//                                         placeholder="New password"
//                                         required
//                                     />
//                                     <select
//                                         value={editingUser.role}
//                                         onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
//                                     >
//                                         <option value="Viewer">Viewer</option>
//                                         <option value="Analyst">Analyst</option>
//                                         <option value="Auditor">Auditor</option>
//                                         <option value="Manager">Manager</option>
//                                         <option value="Administrator">Administrator</option>
//                                     </select>
//                                     <div className="edit-actions">
//                                         <button type="submit" className="btn-success">Save</button>
//                                         <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary">Cancel</button>
//                                     </div>
//                                 </form>
//                             ) : (
//                                 <>
//                                     <div className="user-info">
//                                         <div className="user-email">{user.email}</div>
//                                         <div className="user-details">
//                                             <span className="user-role">{user.role}</span>
//                                             <span className="user-password">Password: {user.password}</span>
//                                         </div>
//                                     </div>
//                                     <div className="user-actions">
//                                         <button
//                                             onClick={() => setEditingUser({ ...user, originalEmail: user.email })}
//                                             className="btn-warning"
//                                         >
//                                             Edit
//                                         </button>
//                                         <button
//                                             onClick={() => handleDeleteUser(user.email)}
//                                             className="btn-danger"
//                                         >
//                                             Delete
//                                         </button>
//                                     </div>
//                                 </>
//                             )}
//                         </div>
//                     ))}
//                 </div>

//                 {filteredUsers.length === 0 && (
//                     <div className="no-users">
//                         No users found matching your search.
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// // My Profile Component
// const MyProfileSection: React.FC = () => {
//     const [profile, setProfile] = useState({
//         name: "",
//         email: "",
//         currentPassword: "",
//         newPassword: "",
//         confirmPassword: ""
//     });

//     const handleProfileUpdate = (e: React.FormEvent) => {
//         e.preventDefault();
//         // Add profile update logic here
//         alert('Profile updated successfully!');
//     };

//     const handlePasswordChange = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (profile.newPassword !== profile.confirmPassword) {
//             alert("New passwords don't match!");
//             return;
//         }
//         // Add password change logic here
//         alert('Password changed successfully!');
//         setProfile(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
//     };

//     return (
//         <div className="profile-section">
//             <h2>My Profile</h2>
//             <p className="section-description">Manage your personal information and security settings</p>

//             {/* Profile Information */}
//             <div className="profile-card">
//                 <h3>Personal Information</h3>
//                 <form onSubmit={handleProfileUpdate} className="profile-form">
//                     <div className="form-group">
//                         <label>Full Name</label>
//                         <input
//                             type="text"
//                             value={profile.name}
//                             onChange={(e) => setProfile({ ...profile, name: e.target.value })}
//                             placeholder="Enter your full name"
//                         />
//                     </div>
//                     <div className="form-group">
//                         <label>Email Address</label>
//                         <input
//                             type="email"
//                             value={profile.email}
//                             onChange={(e) => setProfile({ ...profile, email: e.target.value })}
//                             placeholder="Enter your email address"
//                         />
//                     </div>
//                     <button type="submit" className="btn-primary">Update Profile</button>
//                 </form>
//             </div>

//             {/* Change Password */}
//             <div className="profile-card">
//                 <h3>Change Password</h3>
//                 <form onSubmit={handlePasswordChange} className="profile-form">
//                     <div className="form-group">
//                         <label>Current Password</label>
//                         <input
//                             type="password"
//                             value={profile.currentPassword}
//                             onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
//                             placeholder="Enter current password"
//                         />
//                     </div>
//                     <div className="form-group">
//                         <label>New Password</label>
//                         <input
//                             type="password"
//                             value={profile.newPassword}
//                             onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
//                             placeholder="Enter new password"
//                         />
//                     </div>
//                     <div className="form-group">
//                         <label>Confirm New Password</label>
//                         <input
//                             type="password"
//                             value={profile.confirmPassword}
//                             onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
//                             placeholder="Confirm new password"
//                         />
//                     </div>
//                     <button type="submit" className="btn-primary">Change Password</button>
//                 </form>
//             </div>

//             {/* Account Settings */}
//             <div className="profile-card">
//                 <h3>Account Settings</h3>
//                 <div className="account-actions">
//                     <button className="btn-warning">Export My Data</button>
//                     <button className="btn-danger">Delete Account</button>
//                 </div>
//             </div>
//         </div>
//     );
// };




'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import './profile.css';

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