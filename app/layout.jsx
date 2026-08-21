import "./globals.css";

export const metadata = {
  title: "Axis System",
  description: "Life Axis System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
