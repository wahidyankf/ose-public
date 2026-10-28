import { ResizableSidebar } from "@/features/navigation/shell/resizable-sidebar";
import { Sidebar } from "@/features/navigation/shell/sidebar";
import { SidebarHost } from "@/features/course-paths/shell/sidebar-host";
import type { Locale } from "@/features/i18n/core/config";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ContentLayout({ children, params }: Props) {
  const { locale } = await params;

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl">
      <ResizableSidebar locale={locale as Locale}>
        <SidebarHost locale={locale}>
          <Sidebar locale={locale} />
        </SidebarHost>
      </ResizableSidebar>
      <div className="flex min-w-0 flex-1">{children}</div>
    </div>
  );
}
