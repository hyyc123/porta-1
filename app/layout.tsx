import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QuarterSmart Training",
  description: "QuarterSmart company training portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#070A12", color: "#e9eefc" }}>
        {children}
      </body>
    </html>
  );
}
