import Navbar from "@/components/navbar";
import { ToastProvider } from "@/components/toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
