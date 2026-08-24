import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SHARED_TYPES_VERSION } from "@waslah/shared-types";

export const metadata: Metadata = {
  title: "Waslah",
  description: `Waslah AI Revenue Guardian (shared contracts ${SHARED_TYPES_VERSION})`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
