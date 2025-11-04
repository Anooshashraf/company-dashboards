// "use client";
// import { useState, useEffect, FormEvent } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "../../components/AuthProvider";

// const AUTHENTICATED_USERS = [
//   { email: "fahad@techno-communications.com", password: "fahad123", role: "Manager" },
//   { email: "GHANI@TEXASMOBILEPCS.COM", password: "ghani123", role: "Auditor" },
//   { email: "aleem.ghori@techno-communications.com", password: "aleem123", role: "Analyst" },
//   { email: "hasnain.mustaqeem@techno-communications.com", password: "hasnain123", role: "Viewer" }
// ];

// export default function Login() {
//   const [email, setEmail] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [error, setError] = useState<string>("");
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const { isAuthenticated, login, isLoading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     // Initialize users in localStorage if not present
//     const savedUsers = localStorage.getItem("inventoryUsers");
//     if (!savedUsers) {
//       localStorage.setItem("inventoryUsers", JSON.stringify(AUTHENTICATED_USERS));
//     }

//     if (isAuthenticated && !isLoading) {
//       router.push("/");
//     }
//   }, [isAuthenticated, isLoading, router]);

//   if (isLoading || isAuthenticated) {
//     return (
//       <div className="login-page">
//         <div style={{ textAlign: 'center', color: 'white' }}>
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

//     await new Promise(resolve => setTimeout(resolve, 800));

//     const success = login(email, password);

//     if (success) {
//       router.push("/");
//     } else {
//       setError("Invalid email or password. Please check your credentials.");
//     }
//     setIsSubmitting(false);
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

//           {error && <div className="error-box">{error}</div>}

//           <button
//             type="submit"
//             className="submit-btn"
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? "Signing in..." : "Sign in"}
//           </button>
//         </form>

//         <div className="demo-box">
//           <p className="demo-title">Demo Credentials</p>
//           <div className="demo-text">
//             <p>Email: <span className="demo-code">example@gmail.com</span></p>
//             <p>Password: <span className="demo-code">company123</span></p>
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
  { email: "fahad@techno-communications.com", password: "fahad123", role: "Manager" },
  { email: "GHANI@TEXASMOBILEPCS.COM", password: "ghani123", role: "Auditor" },
  { email: "aleem.ghori@techno-communications.com", password: "aleem123", role: "Analyst" },
  { email: "hasnain.mustaqeem@techno-communications.com", password: "hasnain123", role: "Viewer" }
];

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { isAuthenticated, login, isLoading, user } = useAuth(); // Added user here
  const router = useRouter();

  useEffect(() => {
    // Initialize users in localStorage if not present
    const savedUsers = localStorage.getItem("inventoryUsers");
    if (!savedUsers) {
      localStorage.setItem("inventoryUsers", JSON.stringify(AUTHENTICATED_USERS));
    }

    if (isAuthenticated && !isLoading) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="login-page">
        <div style={{ textAlign: 'center', color: 'white' }}>
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

    await new Promise(resolve => setTimeout(resolve, 800));

    const success = login(email, password); // This now works with your updated AuthProvider

    if (success) {
      router.push("/");
    } else {
      setError("Invalid email or password. Please check your credentials.");
    }
    setIsSubmitting(false);
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

          <div className="form-field">
            <input
              type="password"
              className="form-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="demo-box">
          <p className="demo-title">Demo Credentials</p>
          <div className="demo-text">
            {AUTHENTICATED_USERS.map((user, index) => (
              <div key={index} className="user-credential">
                <p>Email: <span className="demo-code">{user.email}</span></p>
                <p>Password: <span className="demo-code">{user.password}</span></p>
                <p>Role: <span className="demo-code">{user.role}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}