import "./globals.css";

export const metadata = {
  title: "Axis System",
  description: "Life management & optimization system | Turn ambition into action. Opportunity favors the prepared — organize, optimize, execute.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
