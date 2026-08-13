import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarLayoutProvider } from "@/components/layout/SidebarLayoutProvider";
import { UI_COPY } from "@/lib/config/ui-copy";

/** Layout principal com navbar, sidebar, conteúdo e rodapé. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayoutProvider>
      <Navbar />

      <div className="container-fluid p-0">
        <Sidebar />
        <main id="mainContent" className="px-0 main-content d-flex flex-column">
          <div className="container py-4 px-4">
            <div className="page-body">{children}</div>
          </div>
          <footer className="shell-footer">
            <p>{UI_COPY.footer}</p>
          </footer>
        </main>
      </div>
    </SidebarLayoutProvider>
  );
}
