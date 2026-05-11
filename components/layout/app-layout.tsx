import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30 print:bg-white text-foreground print:text-black">
      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        <div className="print:hidden hidden md:block">
          <Sidebar className="h-full" />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
          <div className="print:hidden">
            <Header />
          </div>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible print:bg-white h-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
