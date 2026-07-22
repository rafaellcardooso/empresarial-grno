import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Empresarial GRNO",
    template: "%s · Empresarial GRNO",
  },
  description: "Monitoramento SIR (RAL/REC) e inventário BSOD/PME (hfc-sls)",
  icons: { icon: "/assets/img/logo-claro.png" },
};

/** Layout HTML raiz com assets Bootstrap e tema GRNO. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" data-bs-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|; )emp_theme=(light|dark)/);var t=m?m[1]:localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-bs-theme",t);}}catch(e){}})();`,
          }}
        />
        {/* Tema Bootstrap Claro / GRNO — assets em /public/assets */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/assets/css/bootstrap-icons.min.css" />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/assets/css/style.css" />
      </head>
      <body>
        {children}
        <Script src="/assets/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
