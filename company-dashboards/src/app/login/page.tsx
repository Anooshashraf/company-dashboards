// 'use client';
// import { useState, useEffect, FormEvent } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '../../components/AuthProvider';

// export default function Login() {
//     const [email, setEmail] = useState<string>('');
//     const [password, setPassword] = useState<string>('');
//     const [error, setError] = useState<string>('');
//     const { isAuthenticated, login, isLoading } = useAuth();
//     const router = useRouter();

//     useEffect(() => {
//         if (isAuthenticated && !isLoading) {
//             router.push('/');
//         }
//     }, [isAuthenticated, isLoading, router]);

//     const handleSubmit = (e: FormEvent): void => {
//         e.preventDefault();
//         setError('');

//         if (email === 'admin@company.com' && password === 'company123') {
//             login();
//             router.push('/');
//         } else {
//             setError('Invalid email or password. Use admin@company.com / company123');
//         }
//     };

//     if (isLoading || isAuthenticated) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-gray-50">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//             <div className="max-w-md w-full space-y-8">
//                 <div>
//                     <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
//                         Company Dashboards
//                     </h2>
//                     <p className="mt-2 text-center text-sm text-gray-600">
//                         Sign in to access your reports
//                     </p>
//                 </div>
//                 <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//                     <div className="space-y-4">
//                         <div>
//                             <label htmlFor="email" className="sr-only">
//                                 Email address
//                             </label>
//                             <input
//                                 id="email"
//                                 name="email"
//                                 type="email"
//                                 required
//                                 className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
//                                 placeholder="Email address"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                             />
//                         </div>
//                         <div>
//                             <label htmlFor="password" className="sr-only">
//                                 Password
//                             </label>
//                             <input
//                                 id="password"
//                                 name="password"
//                                 type="password"
//                                 required
//                                 className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
//                                 placeholder="Password"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                             />
//                         </div>
//                     </div>

//                     {error && (
//                         <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">
//                             {error}
//                         </div>
//                     )}

//                     <div>
//                         <button
//                             type="submit"
//                             className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
//                         >
//                             Sign in
//                         </button>
//                     </div>
//                 </form>
//                 <div className="text-center text-sm text-gray-600 bg-white p-4 rounded-lg border border-gray-200">
//                     <p className="font-semibold">Demo credentials:</p>
//                     <p>Email: admin@company.com</p>
//                     <p>Password: company123</p>
//                 </div>
//             </div>
//         </div>
//     );
// }

"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { isAuthenticated, login, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    setError("");

    if (email === "admin@company.com" && password === "company123") {
      login();
      router.push("/");
    } else {
      setError("Invalid email or password. Use admin@company.com / company123");
    }
  };

  return (
    <div className="app login-page">
      <div className="login-container">
        {/* Login Card */}
        <div className="login-card">
          {/* Header */}
          <div className="brand">
            <div className="logo">🔐</div>
            <div className="title">
              <div className="main">Inventory Analytics</div>
              <div className="sub">Sign in to access your reports</div>
            </div>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-url"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-url"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn btn-primary login-btn">
              Sign in
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="demo-credentials">
            <p className="demo-title">Demo credentials:</p>
            <div className="demo-info">
              <p>
                Email: <span>example@company.com</span>
              </p>
              <p>
                Password: <span>example123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
