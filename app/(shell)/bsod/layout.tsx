type LayoutProps = {
  children: React.ReactNode;
};

/** Mantém o agrupamento das rotas BSOD sem duplicar o cabeçalho das páginas. */
export default function Layout({ children }: LayoutProps) {
  return children;
}
