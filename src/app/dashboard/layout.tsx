import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
      <Sidebar />
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
