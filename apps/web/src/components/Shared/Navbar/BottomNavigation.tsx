import {
  BellIcon,
  BoltIcon,
  GlobeAltIcon as GlobeOutline,
  HomeIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import {
  BellIcon as BellIconSolid,
  GlobeAltIcon as GlobeSolid,
  HomeIcon as HomeIconSolid,
  PlayIcon as PlayIconSolid,
  Squares2X2Icon as Squares2X2IconSolid
} from "@heroicons/react/24/solid";
import getAvatar from "@hey/helpers/getAvatar";
import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { productCategories } from "@/components/Products/productsData";
import { Image } from "@/components/Shared/UI";
import { useMobileDrawerModalStore } from "@/store/non-persisted/modal/useMobileDrawerModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import MobileDrawerMenu from "./MobileDrawerMenu";

interface NavigationItemProps {
  path: string;
  label: string;
  outline: ReactNode;
  solid: ReactNode;
  isActive: boolean;
  onClick?: (e: MouseEvent) => void;
}

const NavigationItem = ({
  path,
  label,
  outline,
  solid,
  isActive,
  onClick
}: NavigationItemProps) => (
  <Link
    aria-label={label}
    className="mx-auto my-2 sm:my-3"
    onClick={onClick}
    to={path}
  >
    {isActive ? solid : outline}
  </Link>
);

const BottomNavigation = () => {
  const { pathname } = useLocation();
  const { currentAccount } = useAccountStore();
  const { show: showMobileDrawer, setShow: setShowMobileDrawer } =
    useMobileDrawerModalStore();

  const handleAccountClick = () => setShowMobileDrawer(true);
  const [showProducts, setShowProducts] = useState<boolean>(false);

  const handleHomClick = (path: string, e: MouseEvent) => {
    if (path === "/" && pathname === "/") {
      e.preventDefault();
      window.scrollTo(0, 0);
    }
  };

  const navigationItems = [
    {
      label: "Home",
      outline: <HomeIcon className="size-5 sm:size-6" />,
      path: "/",
      solid: <HomeIconSolid className="size-5 sm:size-6" />
    },
    // Products opened via dedicated button to show a mobile sheet
    {
      label: "Search",
      outline: <MagnifyingGlassIcon className="size-5 sm:size-6" />,
      path: "/search",
      solid: <MagnifyingGlassIcon className="size-5 sm:size-6" />
    },
    {
      label: "Explore",
      outline: <GlobeOutline className="size-5 sm:size-6" />,
      path: "/explore",
      solid: <GlobeSolid className="size-5 sm:size-6" />
    },
    {
      label: "Game Hub",
      outline: <PlayIcon className="size-5 sm:size-6" />,
      path: "/gaming-dashboard",
      solid: <PlayIconSolid className="size-5 sm:size-6" />
    },
    {
      label: "Notifications",
      outline: <BellIcon className="size-5 sm:size-6" />,
      path: "/notifications",
      solid: <BellIconSolid className="size-5 sm:size-6" />
    }
  ];

  // Add On-Chain Dashboard for logged-in users
  const loggedInNavigationItems = currentAccount
    ? [
        ...navigationItems,
        {
          label: "On-Chain",
          outline: <BoltIcon className="size-5 sm:size-6" />,
          path: "/settings/onchain-dashboard",
          solid: <BoltIcon className="size-5 sm:size-6" />
        }
      ]
    : navigationItems;

  return (
    <nav className="safe-area-inset-bottom fixed inset-x-0 bottom-0 z-[5] border-gray-200 border-t bg-white pb-safe md:hidden dark:border-gray-800 dark:bg-black">
      {showMobileDrawer && <MobileDrawerMenu />}
      <div className="flex justify-between">
        {loggedInNavigationItems.map(({ path, label, outline, solid }) => (
          <NavigationItem
            isActive={pathname === path}
            key={path}
            label={label}
            onClick={(e) => handleHomClick(path, e)}
            outline={outline}
            path={path}
            solid={solid}
          />
        ))}
        {/* Inline products trigger for mobile */}
        <div className="mx-auto my-2 sm:my-3 md:hidden">
          <button
            aria-label="Products"
            className="rounded-full p-1"
            onClick={() => setShowProducts(true)}
            type="button"
          >
            {pathname.startsWith("/products/") ? (
              <Squares2X2IconSolid className="size-5 sm:size-6" />
            ) : (
              <Squares2X2Icon className="size-5 sm:size-6" />
            )}
          </button>
        </div>
        {currentAccount && (
          <button
            aria-label="Your account"
            className="m-auto h-fit"
            onClick={handleAccountClick}
            type="button"
          >
            <Image
              alt={currentAccount.address}
              className="m-0.5 size-5 rounded-full border border-gray-200 sm:size-6 dark:border-gray-700"
              src={getAvatar(currentAccount)}
            />
          </button>
        )}
      </div>
      {/* Mobile Products sheet */}
      {showProducts ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[60] md:hidden"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowProducts(false)}
          />
          <div className="safe-area-inset-bottom absolute inset-x-2 bottom-16 max-h-[60vh] overflow-y-auto rounded-xl border border-white/10 bg-black/90 p-3 text-white shadow-xl backdrop-blur-md sm:bottom-14">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-medium text-sm">Products</div>
              <button
                aria-label="Close"
                className="rounded px-2 py-1 text-white/70 text-xs hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                onClick={() => setShowProducts(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <ul className="space-y-3">
              {productCategories.map((cat) => (
                <li key={cat.key}>
                  <div
                    className={[
                      "mb-1",
                      "text-xs",
                      "uppercase",
                      "text-white/60"
                    ].join(" ")}
                  >
                    {cat.title}
                  </div>
                  <ul className="list-none space-y-1">
                    {cat.items.map((p) => (
                      <li key={p.slug}>
                        <Link
                          aria-label={`Go to ${p.title}`}
                          className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                          onClick={() => setShowProducts(false)}
                          to={`/products/${p.slug}`}
                        >
                          <p.icon className="size-4 sm:size-5" />
                          <span className="text-sm">{p.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </nav>
  );
};

export default BottomNavigation;
