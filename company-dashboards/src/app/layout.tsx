// layout.tsx - CORRECTED VERSION
import "./globals.css";
import Navigation from "../components/Navigation";
import { AuthProvider } from "../components/AuthProvider";

export const metadata = {
  title: "Inventory Analytics",
  description: "Dashboard and Reports Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-layout">
            <Navigation />
            {children} {/* Remove main-content wrapper here */}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}