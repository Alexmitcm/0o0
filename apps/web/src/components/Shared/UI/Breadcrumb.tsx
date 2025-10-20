import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import type React from "react";
import { Link, useLocation } from "react-router-dom";
import cn from "@/helpers/cn";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  showHome?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items = [],
  className = "",
  separator,
  showHome = true
}) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from current route if no items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    if (showHome) {
      breadcrumbs.push({
        href: "/",
        icon: <HomeIcon className="h-4 w-4" />,
        label: "Home"
      });
    }

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Convert segment to readable label
      const label = segment
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({
        href: isLast ? undefined : currentPath,
        label
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbs();

  const defaultSeparator = (
    <ChevronRightIcon aria-hidden="true" className="h-4 w-4 text-gray-400" />
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-2 text-sm", className)}
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isFirst = index === 0;

          return (
            <li className="flex items-center" key={index}>
              {!isFirst && (
                <span aria-hidden="true" className="mx-2">
                  {separator || defaultSeparator}
                </span>
              )}

              {item.href && !isLast ? (
                <Link
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1 text-gray-500 hover:text-gray-700",
                    "dark:text-gray-400 dark:hover:text-gray-200",
                    "transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    "-mx-1 -my-0.5 rounded-md px-1 py-0.5"
                  )}
                  to={item.href}
                >
                  {item.icon && (
                    <span aria-hidden="true" className="flex-shrink-0">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1",
                    isLast
                      ? "font-medium text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {item.icon && (
                    <span aria-hidden="true" className="flex-shrink-0">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
