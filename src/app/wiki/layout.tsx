import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/wiki/WikiSidebar";
import { WikiHeader } from "@/components/wiki/WikiHeader";

export default function WikiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            <SidebarProvider>
                <AppSidebar />
                <WikiHeader />
                <main className="flex-1 overflow-auto p-8 pt-16">
                    {children}
                </main>
            </SidebarProvider>
        </div>
    );
}
