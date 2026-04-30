import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Premium Sales CRM",
  description: "CRM consultivo para operações comerciais modernas."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
