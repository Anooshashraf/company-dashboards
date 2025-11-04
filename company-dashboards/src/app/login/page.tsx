// "use client";
// import { useState, useEffect, FormEvent } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "../../components/AuthProvider";


// const AUTHENTICATED_USERS = [
//   { email: "inventory_active8@gmail.com", password: "inventory123", role: "Administrator" },
//   { email: "fahad@techno-communications.com", password: "fahad123", role: "Manager" },
//   { email: "GHANI@TEXASMOBILEPCS.COM", password: "ghani123", role: "Auditor" },
//   { email: "aleem.ghori@techno-communications.com", password: "aleem123", role: "Analyst" },
//   { email: "hasnain.mustaqeem@techno-communications.com", password: "hm123", role: "Viewer" }
// ];

// export default function Login() {
//   const [email, setEmail] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [error, setError] = useState<string>("");
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const { isAuthenticated, login, isLoading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
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

//     const validUser = AUTHENTICATED_USERS.find(
//       user => user.email === email && user.password === password
//     );

//     if (validUser) {
//       login();
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
  { email: "inventory@gmail.com", password: "inventory", role: "Administrator" },
  { email: "fahad@techno-communications.com", password: "fahad123", role: "Manager" },
  { email: "GHANI@TEXASMOBILEPCS.COM", password: "ghani123", role: "Auditor" },
  { email: "aleem.ghori@techno-communications.com", password: "aleem123", role: "Analyst" },
  { email: "hasnain.mustaqeem@techno-communications.com", password: "hm123", role: "Viewer" }
];

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { isAuthenticated, login, isLoading } = useAuth();
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

    const success = login(email, password);

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
            <p>Email: <span className="demo-code">example@gmail.com</span></p>
            <p>Password: <span className="demo-code">company123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}