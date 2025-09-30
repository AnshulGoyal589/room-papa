'use client';

// import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import RoleProtection from "@/components/auth/RoleProtection";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <RoleProtection>
      {/* <Header /> */}
      <main className="flex-grow">{children}</main>
      <Footer />
    </RoleProtection>
  );
}
