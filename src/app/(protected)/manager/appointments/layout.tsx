
// import { Header2 } from "@/components/layout/Header2";
import React from "react";

interface AdminDashboardLayoutProps {
    children: React.ReactNode;
}

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ children }) => {
    return (
        <div>
            {/* <Header2 /> */}
            <main>{children}</main>
        </div>
    );
};

export default AdminDashboardLayout;