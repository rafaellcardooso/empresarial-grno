import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarLayoutProvider } from "@/components/layout/SidebarLayoutProvider";
import { UI_COPY } from "@/lib/config/ui-copy";

/** Layout principal com navbar, sidebar, conteúdo e rodapé. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayoutProvider>
      <Navbar />

      <div className="container-fluid">
        <div className="row">
          <Sidebar />
          <main
            id="mainContent"
            className="col-md-9 ms-sm-auto col-lg-10 px-0 main-content d-flex flex-column"
          >
            <div className="container py-4 px-4">{children}</div>
            <footer className="mt-auto py-3 border-top text-center text-body-secondary small">
              {UI_COPY.footer}
            </footer>
          </main>
        </div>
      </div>
    </SidebarLayoutProvider>
  );
}
