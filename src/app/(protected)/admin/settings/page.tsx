import RequireRole from "@/components/layout/RequireRole";

export default function SettingsPage() {
  return (
    <RequireRole allowedRoles={['admin']}>
      <div>
        <h1>Admin Settings</h1>
        {/* Admin only content here */}
      </div>
    </RequireRole>
  );
}