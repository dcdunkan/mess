import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const fixelFont = localFont({
    src: [
        {
            path: "../../public/fonts/FixelVariable.woff2",
            style: "normal",
        },
        {
            path: "../../public/fonts/FixelVariableItalic.woff2",
            style: "italic",
        },
    ],
});

export const metadata: Metadata = {
    title: "Hostel",
    description: "TKMCE Hostels",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={fixelFont.className}>
                <Toaster position="top-center" />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
