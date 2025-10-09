"use client";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated || pathname === "/login") return null;

  return (
    <nav className="app-nav">
      <div className="nav-container">
        <Link href="/" className="nav-brand">
          <div className="nav-logo">⚡</div>
          <div className="nav-title">
            <div className="main">Inventory Analytics</div>
          </div>
        </Link>

        <div className="nav-controls">
          <div className="user-info">
            <div className="user-avatar">A</div>
            <span className="user-name">Welcome, Admin</span>
          </div>
          <button onClick={logout} className="btn btn-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
