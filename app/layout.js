import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs";
import "./globals.css"; 

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <KindeProvider>{children}</KindeProvider>
      </body>
    </html>
  );
}