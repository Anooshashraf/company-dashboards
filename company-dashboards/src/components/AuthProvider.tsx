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

// Default users - same as in login
const DEFAULT_USERS = [
  { email: "inventory_active8@gmail.com", password: "inventory123", role: "Administrator" },
  { email: "fahad@techno-communications.com", password: "fahad123", role: "Manager" },
  { email: "GHANI@TEXASMOBILEPCS.COM", password: "ghani123", role: "Auditor" },
  { email: "aleem.ghori@techno-communications.com", password: "aleem123", role: "Analyst" },
  { email: "hasnain.mustaqeem@techno-communications.com", password: "hm123", role: "Viewer" }
];

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    const savedUser = localStorage.getItem("currentUser");

    if (authStatus && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): boolean => {
    // Get users from localStorage or use defaults
    const savedUsers = localStorage.getItem("inventoryUsers");
    const users = savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;

    const validUser = users.find(
      (user: User) => user.email === email && user.password === password
    );

    if (validUser) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("currentUser", JSON.stringify(validUser));
      setIsAuthenticated(true);
      setUser(validUser);
      return true;
    }
    return false;
  };

  const logout = (): void => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUserPassword = (newPassword: string): void => {
    if (!user) return;

    // Get current users
    const savedUsers = localStorage.getItem("inventoryUsers");
    const users = savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;

    // Update the user's password
    const updatedUsers = users.map((u: User) =>
      u.email === user.email ? { ...u, password: newPassword } : u
    );

    // Update current user
    const updatedUser = { ...user, password: newPassword };

    // Save to localStorage
    localStorage.setItem("inventoryUsers", JSON.stringify(updatedUsers));
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    // Update state
    setUser(updatedUser);
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