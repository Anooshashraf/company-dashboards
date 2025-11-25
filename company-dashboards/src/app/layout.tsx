import "./globals.css";
import Navigation from "../components/Navigation";
import { AuthProvider } from "../components/AuthProvider";
import { SettingsProvider } from './SettingsContext';


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
    <html lang="en" suppressHydrationWarning>
      <body>
        <SettingsProvider>
          <AuthProvider>
            <div className="app-layout">
              <Navigation />
              {children}
            </div>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}

