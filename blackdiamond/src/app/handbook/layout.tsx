import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employee Handbook — Black Diamond Alpine Wash",
  robots: { index: false, follow: false },
};

export default function HandbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
