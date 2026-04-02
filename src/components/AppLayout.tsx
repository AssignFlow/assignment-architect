import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
