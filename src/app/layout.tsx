import type { Metadata } from "next";
import { Montserrat, Inter, Orbitron } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import NavBar from "@/components/nav-bar";
import { Toaster } from "@/components/ui/sonner";

const montserrat = Montserrat({
    subsets: ["latin"],
});

const inter = Inter({
    subsets: ["latin"],
});

const orbitron = Orbitron({
    subsets: ["latin"],
    weight: ["400", "500"],
});

export const metadata: Metadata = {
    title: "Holocron",
    description: "Administration platform for the 9th Assault Corps.",
    icons: "/images/holocron.png",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${montserrat.className} ${inter.className} antialiased`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <NavBar />
                    <main className="pt-16">{children}</main>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
