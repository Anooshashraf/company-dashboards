// "use client";
// import { useAuth } from "./AuthProvider";
// import { SettingsProvider } from '../app/SettingsContext';

// import { usePathname } from "next/navigation";
// import Link from "next/link";
// import { useState } from "react";

// export default function Navigation() {
//   const { isAuthenticated, logout } = useAuth();
//   const pathname = usePathname();
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);

//   if (!isAuthenticated || pathname === "/login") return null;

//   return (
//     <>

//       <nav className="top-bar">
//         <div className="top-bar-container">

//           <div className="top-bar-left">
//             <button
//               className="hamburger-btn"
//               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             >
//               <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
//                 <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
//               </svg>
//             </button>

//             <Link href="/" className="company-brand">
//               <div className="company-logo">
//                 <span className="logo-icon">⚡</span>
//               </div>
//               <span className="company-name">Inventory Analytics</span>
//             </Link>
//           </div>


//           <div className="top-bar-right">
//             <div className="admin-profile">
//               <div className="admin-avatar">
//                 <span className="avatar-text">A</span>
//               </div>
//               <div className="admin-info">
//                 <span className="admin-name">Administrator</span>
//               </div>
//               <div className="profile-dropdown">
//                 <button className="dropdown-trigger">
//                   <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M7 10l5 5 5-5z" />
//                   </svg>
//                 </button>
//                 <div className="dropdown-menu">
//                   <button className="dropdown-item">
//                     <Link
//                       href="/profile"
//                       className={`nav-item ${pathname === 'profile'} `}
//                     ><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                         <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
//                       </svg>
//                     </Link>

//                     My Profile
//                   </button>
//                   <button className="dropdown-item">
//                     <Link
//                       href="/settings"
//                       className={`nav-item ${pathname === 'settings'} `}
//                     >
//                       <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                         <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
//                       </svg>
//                       Settings
//                     </Link>
//                   </button>
//                   <div className="dropdown-divider"></div>
//                   <button onClick={logout} className="dropdown-item logout">
//                     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                       <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
//                     </svg>
//                     Logout
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Sidebar Navigation */}
//       <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
//         <div className="sidebar-content">

//           <nav className="sidebar-nav">
//             <div className="nav-section">
//               <div className="nav-section-label">MAIN</div>
//               <Link
//                 href="/dashboard/audit"
//                 className={`nav-item ${pathname === '/dashboard/audit' ? 'nav-item-active' : ''}`}
//               >
//                 <span className="nav-icon">📊</span>
//                 <span className="nav-text">Audit</span>
//               </Link>
//               <Link
//                 href="/dashboard/rma"
//                 className={`nav-item ${pathname === '/dashboard/rma' ? 'nav-item-active' : ''}`}
//               >
//                 <span className="nav-icon">🔄</span>
//                 <span className="nav-text">RMA Management</span>
//               </Link>
//               <Link
//                 href="/dashboard/ordering"
//                 className={`nav-item ${pathname === '/dashboard/ordering' ? 'nav-item-active' : ''}`}
//               >
//                 <span className="nav-icon">📦</span>
//                 <span className="nav-text">Ordering</span>
//               </Link>
//               <Link
//                 href="/dashboard/isr"
//                 className={`nav-item ${pathname === '/dashboard/isr' ? 'nav-item-active' : ''}`}
//               >
//                 <span className="nav-icon">📈</span>
//                 <span className="nav-text">IAS report</span>
//               </Link>
//             </div>


//             <div className="nav-section">
//               <div className="nav-section-label">TOOLS</div>
//               <Link
//                 href="/settings"
//                 className={`nav-item ${pathname === '/settings' ? 'nav-item-active' : ''}`}
//               >
//                 <span className="nav-icon">⚙️</span>
//                 <span className="nav-text">Settings</span>
//               </Link>
//               <Link
//                 href="/help-support"
//                 className={`nav-item ${pathname === '/help-support' ? 'nav-item-active' : ''}`}
//               >
//                 <span className="nav-icon">💬</span>
//                 <span className="nav-text">Help & Support</span>
//               </Link>
//             </div>
//           </nav>

//           {/* Sidebar Footer */}
//           <div className="sidebar-footer">
//             <div className="copyright">© 2024 Inventory Analytics</div>
//           </div>
//         </div >
//       </aside >

//       {/* Overlay for mobile */}
//       {
//         isSidebarOpen && (
//           <div
//             className="sidebar-overlay"
//             onClick={() => setIsSidebarOpen(false)}
//           />
//         )
//       }
//     </>
//   );
// }






"use client";
import { useAuth } from "./AuthProvider";
import { SettingsProvider } from '../app/SettingsContext';
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isAuthenticated || pathname === "/login") return null;

  return (
    <>
      <nav className="top-bar">
        <div className="top-bar-container">
          <div className="top-bar-left">
            <button
              className="hamburger-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>

            <Link href="/" className="company-brand">
              <div className="company-logo">
                <span className="logo-icon">⚡</span>
              </div>
              <span className="company-name">Inventory Analytics</span>
            </Link>
          </div>

          <div className="top-bar-right">
            <div className="admin-profile">
              <div className="admin-avatar">
                <span className="avatar-text">A</span>
              </div>
              <div className="admin-info">
                <span className="admin-name">Administrator</span>
              </div>
              <div className="profile-dropdown">
                <button
                  className="dropdown-trigger"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <Link
                      href="/profile"
                      className="dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                      </svg>
                      Settings
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="dropdown-item logout"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-section-label">MAIN</div>
              <Link
                href="/dashboard/audit"
                className={`nav-item ${pathname === '/dashboard/audit' ? 'nav-item-active' : ''}`}
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Audit</span>
              </Link>
              <Link
                href="/dashboard/rma"
                className={`nav-item ${pathname === '/dashboard/rma' ? 'nav-item-active' : ''}`}
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
              >
                <span className="nav-icon">🔄</span>
                <span className="nav-text">RMA Management</span>
              </Link>
              <Link
                href="/dashboard/ordering"
                className={`nav-item ${pathname === '/dashboard/ordering' ? 'nav-item-active' : ''}`}
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
              >
                <span className="nav-icon">📦</span>
                <span className="nav-text">Ordering</span>
              </Link>
              <Link
                href="/dashboard/isr"
                className={`nav-item ${pathname === '/dashboard/isr' ? 'nav-item-active' : ''}`}
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
              >
                <span className="nav-icon">📈</span>
                <span className="nav-text">IAS report</span>
              </Link>
            </div>

            <div className="nav-section">
              <div className="nav-section-label">TOOLS</div>
              <Link
                href="/profile"
                className={`nav-item ${pathname === '/profile' ? 'nav-item-active' : ''}`}
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
              >
                <span className="nav-icon">👤</span>
                <span className="nav-text">Profile</span>
              </Link>
              <Link
                href="/settings"
                className={`nav-item ${pathname === '/settings' ? 'nav-item-active' : ''}`}
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
              >
                <span className="nav-icon">⚙️</span>
                <span className="nav-text">Settings</span>
              </Link>
              <Link
                href="/help-support"
                className={`nav-item ${pathname === '/help-support' ? 'nav-item-active' : ''}`}
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
              >
                <span className="nav-icon">💬</span>
                <span className="nav-text">Help & Support</span>
              </Link>
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            <div className="copyright">© 2024 Inventory Analytics</div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div
          className="dropdown-overlay"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      <style jsx>{`
        .dropdown-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 998;
        }
      `}</style>
    </>
  );
}