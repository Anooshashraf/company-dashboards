// "use client";
// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   ReactNode,
// } from "react";

// interface AuthContextType {
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   login: () => void;
//   logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider = ({ children }: AuthProviderProps) => {
//   const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
//   const [isLoading, setIsLoading] = useState<boolean>(true);

//   useEffect(() => {
//     const authStatus = localStorage.getItem("isAuthenticated") === "true";
//     setIsAuthenticated(authStatus);
//     setIsLoading(false);
//   }, []);

//   const login = (): void => {
//     localStorage.setItem("isAuthenticated", "true");
//     setIsAuthenticated(true);
//   };

//   const logout = (): void => {
//     localStorage.removeItem("isAuthenticated");
//     setIsAuthenticated(false);
//   };

//   return (
//     <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };




// "use client";
// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   ReactNode,
// } from "react";

// interface User {
//   email: string;
//   password: string;
//   role: string;
// }

// interface AuthContextType {
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   user: User | null;
//   login: (email: string, password: string) => boolean;
//   logout: () => void;
//   updateUserPassword: (newPassword: string) => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // Default users - same as in login
// const DEFAULT_USERS = [
//   { email: "inventory_active8@gmail.com", password: "inventory123", role: "Administrator" },
//   { email: "fahad@techno-communications.com", password: "fahad123", role: "Manager" },
//   { email: "GHANI@TEXASMOBILEPCS.COM", password: "ghani123", role: "Auditor" },
//   { email: "aleem.ghori@techno-communications.com", password: "aleem123", role: "Analyst" },
//   { email: "hasnain.mustaqeem@techno-communications.com", password: "hm123", role: "Viewer" }
// ];

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider = ({ children }: AuthProviderProps) => {
//   const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     const authStatus = localStorage.getItem("isAuthenticated") === "true";
//     const savedUser = localStorage.getItem("currentUser");

//     if (authStatus && savedUser) {
//       setIsAuthenticated(true);
//       setUser(JSON.parse(savedUser));
//     }
//     setIsLoading(false);
//   }, []);

//   const login = (email: string, password: string): boolean => {
//     // Get users from localStorage or use defaults
//     const savedUsers = localStorage.getItem("inventoryUsers");
//     const users = savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;

//     const validUser = users.find(
//       (user: User) => user.email === email && user.password === password
//     );

//     if (validUser) {
//       localStorage.setItem("isAuthenticated", "true");
//       localStorage.setItem("currentUser", JSON.stringify(validUser));
//       setIsAuthenticated(true);
//       setUser(validUser);
//       return true;
//     }
//     return false;
//   };

//   const logout = (): void => {
//     localStorage.removeItem("isAuthenticated");
//     localStorage.removeItem("currentUser");
//     setIsAuthenticated(false);
//     setUser(null);
//   };

//   const updateUserPassword = (newPassword: string): void => {
//     if (!user) return;

//     // Get current users
//     const savedUsers = localStorage.getItem("inventoryUsers");
//     const users = savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;

//     // Update the user's password
//     const updatedUsers = users.map((u: User) =>
//       u.email === user.email ? { ...u, password: newPassword } : u
//     );

//     // Update current user
//     const updatedUser = { ...user, password: newPassword };

//     // Save to localStorage
//     localStorage.setItem("inventoryUsers", JSON.stringify(updatedUsers));
//     localStorage.setItem("currentUser", JSON.stringify(updatedUser));

//     // Update state
//     setUser(updatedUser);
//   };

//   return (
//     <AuthContext.Provider value={{
//       isAuthenticated,
//       login,
//       logout,
//       isLoading,
//       user,
//       updateUserPassword
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };









// "use client";
// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   ReactNode,
// } from "react";

// interface User {
//   email: string;
//   password: string;
//   role: string;
// }

// interface AuthContextType {
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   user: User | null;
//   login: (email: string, password: string) => boolean;
//   logout: () => void;
//   updateUserPassword: (newPassword: string) => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // Default users - same as in login
// const DEFAULT_USERS = [
//   { email: "inventory2025@gmail.com", password: "inventory2025", role: "Analyst" },
//   { email: "fahad@techno-communications.com", password: "fahad123", role: "Manager" },
//   { email: "GHANI@TEXASMOBILEPCS.COM", password: "ghani123", role: "Auditor" },
//   { email: "aleem.ghori@techno-communications.com", password: "aleem123", role: "Analyst" },
//   { email: "hasnain.mustaqeem@techno-communications.com", password: "hasnain123", role: "Viewer" }
// ];

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider = ({ children }: AuthProviderProps) => {
//   const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [user, setUser] = useState<User | null>(null);

//   // Initialize users in localStorage on first load
//   useEffect(() => {
//     const savedUsers = localStorage.getItem("inventoryUsers");
//     if (!savedUsers) {
//       localStorage.setItem("inventoryUsers", JSON.stringify(DEFAULT_USERS));
//     }

//     const authStatus = localStorage.getItem("isAuthenticated") === "true";
//     const savedUser = localStorage.getItem("currentUser");

//     if (authStatus && savedUser) {
//       setIsAuthenticated(true);
//       setUser(JSON.parse(savedUser));
//     }
//     setIsLoading(false);
//   }, []);

//   const getUsers = (): User[] => {
//     const savedUsers = localStorage.getItem("inventoryUsers");
//     return savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;
//   };

//   const login = (email: string, password: string): boolean => {
//     // Always get users from localStorage to ensure we have the latest passwords
//     const users = getUsers();

//     const validUser = users.find(
//       (user: User) => user.email === email && user.password === password
//     );

//     if (validUser) {
//       localStorage.setItem("isAuthenticated", "true");
//       localStorage.setItem("currentUser", JSON.stringify(validUser));
//       setIsAuthenticated(true);
//       setUser(validUser);
//       return true;
//     }
//     return false;
//   };

//   const logout = (): void => {
//     localStorage.removeItem("isAuthenticated");
//     localStorage.removeItem("currentUser");
//     setIsAuthenticated(false);
//     setUser(null);
//   };

//   const updateUserPassword = (newPassword: string): void => {
//     if (!user) return;

//     // Get current users from localStorage
//     const users = getUsers();

//     // Update the user's password
//     const updatedUsers = users.map((u: User) =>
//       u.email === user.email ? { ...u, password: newPassword } : u
//     );

//     // Update current user
//     const updatedUser = { ...user, password: newPassword };

//     // Save to localStorage
//     localStorage.setItem("inventoryUsers", JSON.stringify(updatedUsers));
//     localStorage.setItem("currentUser", JSON.stringify(updatedUser));

//     // Update state
//     setUser(updatedUser);
//   };

//   return (
//     <AuthContext.Provider value={{
//       isAuthenticated,
//       login,
//       logout,
//       isLoading,
//       user,
//       updateUserPassword
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };





"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface User {
  email: string;
  password: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateUserPassword: (newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default users - EXACTLY match your login component
const DEFAULT_USERS = [
  {
    email: "fahad@techno-communications.com",
    password: "fahad123",
    role: "Manager",
  },
  { email: "GHANI@TEXASMOBILEPCS.COM", password: "ghani123", role: "Auditor" },
  {
    email: "aleem.ghori@techno-communications.com",
    password: "aleem123",
    role: "Analyst",
  },
  {
    email: "hasnain.mustaqeem@techno-communications.com",
    password: "hasnain123", // Note: This was "hm123" in your AuthProvider but "hasnain123" in login
    role: "Viewer",
  },
  {
    email: "inventory2025@gmail.com",
    password: "inventory2025", // Make sure this matches exactly
    role: "Viewer",
  },
];

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  // Initialize users in localStorage on first load
  useEffect(() => {
    console.log("🔄 AuthProvider initializing...");

    const savedUsers = localStorage.getItem("inventoryUsers");
    console.log("📦 Saved users in localStorage:", savedUsers);

    if (!savedUsers) {
      localStorage.setItem("inventoryUsers", JSON.stringify(DEFAULT_USERS));
      console.log("✅ Default users initialized:", DEFAULT_USERS);
    } else {
      const parsedUsers = JSON.parse(savedUsers);
      console.log("📋 Existing users found:", parsedUsers);

      // Check if inventory2025 user exists and has correct password
      const inventoryUser = parsedUsers.find((u: User) =>
        u.email.toLowerCase().includes("inventory2025")
      );
      console.log("🔍 Inventory2025 user check:", inventoryUser);
    }

    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    const savedUser = localStorage.getItem("currentUser");

    console.log("🔐 Auth status:", authStatus);
    console.log("👤 Saved user:", savedUser);

    if (authStatus && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
      console.log("🎯 User session restored:", JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const getUsers = (): User[] => {
    const savedUsers = localStorage.getItem("inventoryUsers");
    const users = savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;
    console.log("📊 getUsers returned:", users);
    return users;
  };

  const login = (email: string, password: string): boolean => {
    console.log("===============================");
    console.log("🔐 LOGIN ATTEMPT STARTED");
    console.log("📧 Input email:", email);
    console.log("🔑 Input password:", password);
    console.log("📧 Input email length:", email.length);
    console.log("🔑 Input password length:", password.length);

    // Always get users from localStorage to ensure we have the latest passwords
    const users = getUsers();
    console.log("📋 Total users available:", users.length);

    users.forEach((user: User, index: number) => {
      console.log(`👤 User ${index + 1}:`, {
        email: user.email,
        password: user.password,
        emailMatch: user.email.toLowerCase() === email.toLowerCase(),
        passwordMatch: user.password === password,
        emailLength: user.email.length,
        passwordLength: user.password.length
      });
    });

    // FIX: Use case-insensitive email comparison
    const validUser = users.find(
      (user: User) => {
        const emailMatches = user.email.toLowerCase() === email.toLowerCase();
        const passwordMatches = user.password === password;
        console.log(`🔍 Checking user ${user.email}:`, {
          emailMatches,
          passwordMatches,
          inputEmail: email,
          storedEmail: user.email,
          inputPassword: password,
          storedPassword: user.password
        });
        return emailMatches && passwordMatches;
      }
    );

    console.log("✅ Valid user found:", validUser);

    if (validUser) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("currentUser", JSON.stringify(validUser));
      setIsAuthenticated(true);
      setUser(validUser);
      console.log("🎉 LOGIN SUCCESSFUL!");
      console.log("===============================");
      return true;
    }

    console.log("❌ LOGIN FAILED - No matching user found");
    console.log("===============================");
    return false;
  };

  const logout = (): void => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    setIsAuthenticated(false);
    setUser(null);
    console.log("👋 User logged out");
  };

  const updateUserPassword = (newPassword: string): void => {
    if (!user) return;

    // Get current users from localStorage
    const users = getUsers();

    // Update the user's password
    const updatedUsers = users.map((u: User) =>
      u.email.toLowerCase() === user.email.toLowerCase()
        ? { ...u, password: newPassword }
        : u
    );

    // Update current user
    const updatedUser = { ...user, password: newPassword };

    // Save to localStorage
    localStorage.setItem("inventoryUsers", JSON.stringify(updatedUsers));
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    // Update state
    setUser(updatedUser);

    console.log("🔑 Password updated successfully");
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login,
      logout,
      isLoading,
      user,
      updateUserPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};