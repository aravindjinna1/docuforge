import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { MobileSidebarProvider } from "@/components/layout/MobileSidebarProvider";

export const metadata: Metadata = {
  title: "DocuCraft — AI Document Automation",
  description: "Generate professional emails, cover letters, resumes, and more with AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-[var(--surface-base)] text-[var(--text-primary)]">
        <MobileSidebarProvider>
          <div className="flex min-h-screen w-full">
            <Sidebar />

            <div className="flex min-w-0 flex-1 flex-col">
              <TopHeader />
              <main
                className="flex-1 overflow-y-auto"
                style={{ background: "var(--surface-base)" }}
              >
                <div className="mx-auto h-full max-w-[1400px] px-4 py-4 sm:px-6 sm:py-6">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </MobileSidebarProvider>
      </body>
    </html>
  );
}

