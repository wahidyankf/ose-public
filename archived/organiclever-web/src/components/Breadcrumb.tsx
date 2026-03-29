import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Breadcrumb: React.FC = () => {
  const pathname = usePathname();
  if (!pathname) return null;
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex space-x-2 text-sm text-gray-600">
        <li>
          <Link href="/dashboard" className="hover:text-gray-900">
            Dashboard
          </Link>
        </li>
        {pathSegments.slice(1).map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 2).join("/")}`;
          const isLast = index === pathSegments.length - 2;
          return (
            <li key={segment}>
              <span className="mx-2">/</span>
              {isLast ? (
                <span className="font-semibold text-gray-900">{capitalize(segment)}</span>
              ) : (
                <Link href={href} className="hover:text-gray-900">
                  {capitalize(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
