import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import { AccountMenu } from "../components/auth/account-menu";
import { AuthProvider } from "../components/auth/auth-provider";
import { SignInButton } from "../components/auth/sign-in-button";
import "./globals.css";

const fontCormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const fontDmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

const fontJetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "TravelBuddy",
  description: "AI-powered travel itineraries with real flight and hotel data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontCormorant.variable} ${fontDmSans.variable} ${fontJetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-tb-navy font-body text-tb-white">
        <AuthProvider>
          {children}
          <AccountMenu />
          <SignInButton />
        </AuthProvider>
      </body>
    </html>
  );
}
