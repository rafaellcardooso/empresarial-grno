import { PageHeader } from "@/components/ui/PageHeader";

type LayoutProps = {
  children: React.ReactNode;
};

/** Shell BSOD: cabeçalho; filtros e tabela em page.tsx. */
export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <PageHeader title="BSOD" />
      {children}
    </>
  );
}
