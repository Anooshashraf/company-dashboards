
// "use client";
// import { useState, useEffect, FormEvent } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "../../components/AuthProvider";

// const AUTHENTICATED_USERS = [
//   {
//     email: "fahad@techno-communications.com",
//     password: "fahad123",
//     role: "Manager",
//   },
//   { email: "GHANI@TEXASMOBILEPCS.COM", password: "ghani123", role: "Auditor" },
//   {
//     email: "aleem.ghori@techno-communications.com",
//     password: "aleem123",
//     role: "Analyst",
//   },
//   {
//     email: "hasnain.mustaqeem@techno-communications.com",
//     password: "hasnain123",
//     role: "Viewer",
//   },
//   {
//     email: "inventory2025@gmail.com",
//     password: "inventory2025",
//     role: "Viewer",
//   },
//   {
//     email: "nasim@techno-communications.com",
//     password: "nasim123",
//     role: "Viewer",
//   },
// ];

// export default function Login() {
//   const [email, setEmail] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [error, setError] = useState<string>("");

//   const [showPassword, setShowPassword] = useState<boolean>(false); // New state for password visibility

//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const { isAuthenticated, login, isLoading, user } = useAuth(); // Added user here
//   const router = useRouter();

//   useEffect(() => {
//     // Initialize users in localStorage if not present
//     const savedUsers = localStorage.getItem("inventoryUsers");
//     if (!savedUsers) {
//       localStorage.setItem(
//         "inventoryUsers",
//         JSON.stringify(AUTHENTICATED_USERS)
//       );
//     }

//     if (isAuthenticated && !isLoading) {
//       router.push("/");
//     }
//   }, [isAuthenticated, isLoading, router]);

//   if (isLoading || isAuthenticated) {
//     return (
//       <div className="login-page">
//         <div style={{ textAlign: "center", color: "white" }}>
//           <div className="loading-spinner"></div>
//           <p>Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   const handleSubmit = async (e: FormEvent): Promise<void> => {
//     e.preventDefault();
//     setError("");
//     setIsSubmitting(true);

//     await new Promise((resolve) => setTimeout(resolve, 800));

//     const success = login(email, password); // This now works with your updated AuthProvider

//     if (success) {
//       router.push("/");
//     } else {
//       setError("Invalid email or password. Please check your credentials.");
//     }
//     setIsSubmitting(false);
//   };

//   const togglePasswordVisibility = (): void => {
//     setShowPassword(!showPassword);
//   };

//   return (
//     <div className="login-page">
//       <div className="login-box">
//         <div className="login-header">
//           <div className="login-icon">⚡</div>
//           <h1 className="login-title">Inventory Analytics</h1>
//           <p className="login-subtitle">Sign in to access your dashboard</p>
//         </div>

//         <form className="login-form" onSubmit={handleSubmit}>
//           <div className="form-field">
//             <input
//               type="email"
//               className="form-input"
//               placeholder="Email address"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               disabled={isSubmitting}
//               required
//             />
//           </div>

//           <div className="form-field">
//             <input
//               type="password"
//               className="form-input"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               disabled={isSubmitting}
//               required
//             />
//           </div>

//           <div className="form-field password-field">
//             <input
//               type={showPassword ? "text" : "password"} // Toggle between text and password
//               className="form-input"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               disabled={isSubmitting}
//               required
//             />
//             <button
//               type="button"
//               className="password-toggle"
//               onClick={togglePasswordVisibility}
//               disabled={isSubmitting}
//             >
//               {showPassword ? "🙈" : "👁️"}
//             </button>
//           </div>

//           {error && <div className="error-box">{error}</div>}

//           <button type="submit" className="submit-btn" disabled={isSubmitting}>
//             {isSubmitting ? "Signing in..." : "Sign in"}
//           </button>
//         </form>

//         <div className="demo-box">
//           <p className="demo-title">Demo Credentials</p>
//           <div className="demo-text">
//             {/* {AUTHENTICATED_USERS.map((user, index) => (
//               <div key={index} className="user-credential">
//                 <p>Email: <span className="demo-code">{user.email}</span></p>
//                 <p>Password: <span className="demo-code">{user.password}</span></p>
//                 <p>Role: <span className="demo-code">{user.role}</span></p>
//               </div>
//             ))} */}
//             <div className="user-credential">
//               <p>
//                 Demo Email: <span className="demo-code">example@gmail.com</span>
//               </p>
//               <p>
//                 Demo Password: <span className="demo-code">example123</span>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }






"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";

const AUTHENTICATED_USERS = [
  {
    email: "fahad@techno-communications.com",
    password: "fahad123",
    role: "Manager",
  },
  { email: "GHANI@TEXASMOBILEPCS.COM", password: "ghani123", role: "Manager" },
  {
    email: "aleem.ghori@techno-communications.com",
    password: "aleem123",
    role: "Viewer",
  },
  {
    email: "hasnain.mustaqeem@techno-communications.com",
    password: "hasnain123",
    role: "Viewer",
  },
  {
    email: "inventory2025@gmail.com",
    password: "inventory2025",
    role: "Viewer",
  },
  {
    email: "nasim@techno-communications.com",
    password: "nasim123",
    role: "Viewer",
  },
];

// SVG Icons
const EyeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { isAuthenticated, login, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const savedUsers = localStorage.getItem("inventoryUsers");
    if (!savedUsers) {
      localStorage.setItem(
        "inventoryUsers",
        JSON.stringify(AUTHENTICATED_USERS)
      );
    }

    if (isAuthenticated && !isLoading) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="login-page">
        <div style={{ textAlign: "center", color: "white" }}>
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const success = login(email, password);

    if (success) {
      router.push("/");
    } else {
      setError("Invalid email or password. Please check your credentials.");
    }
    setIsSubmitting(false);
  };

  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <div className="login-icon">⚡</div>
          <h1 className="login-title">Inventory Analytics</h1>
          <p className="login-subtitle">Sign in to access your dashboard</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <input
              type="email"
              className="form-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field password-field">
            <input
              type={showPassword ? "text" : "password"}
              className="form-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
              disabled={isSubmitting}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="demo-box">
          <p className="demo-title">Demo Credentials</p>
          <div className="demo-text">
            <div className="user-credential">
              <p>
                Demo Email: <span className="demo-code">example@gmail.com</span>
              </p>
              <p>
                Demo Password: <span className="demo-code">example123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}