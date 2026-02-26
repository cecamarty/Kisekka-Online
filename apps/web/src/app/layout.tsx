import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kisekka Online — Find Spare Parts Fast",
  description:
    "Kisekka Market's digital notice board. Post what you need, get responses from real shops, and chat on WhatsApp. Find spare parts fast.",
  keywords: [
    "Kisekka",
    "spare parts",
    "car parts",
    "Kampala",
    "Uganda",
    "marketplace",
    "auto parts",
  ],
  openGraph: {
    title: "Kisekka Online — Find Spare Parts Fast",
    description:
      "Post what you need, get responses from real Kisekka shops, and chat on WhatsApp.",
    type: "website",
    locale: "en_UG",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFFFFF",
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
          <div className="app-shell">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
