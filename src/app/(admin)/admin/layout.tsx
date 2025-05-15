import AppShell from '@/components/layout/AppShell';

export default function AdminPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We can reuse the AppShell for admin pages to keep consistent navigation
  // or create a dedicated AdminShell if different structure/sidebar is needed.
  // For simplicity, reusing AppShell.
  return <AppShell>{children}</AppShell>;
}
