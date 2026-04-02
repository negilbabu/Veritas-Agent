import { GoogleOAuthProvider } from '@react-oauth/google';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { NEXT_PUBLIC_GOOGLE_CLIENT_ID } from '../../config';
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Veritas",
  description: "Your Clinical Intelligence Agent",
  icons: {
    icon:     "/icon.svg",
    shortcut: "/icon.svg",
    apple:    "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleOAuthProvider clientId={NEXT_PUBLIC_GOOGLE_CLIENT_ID}> 
          <AuthProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}