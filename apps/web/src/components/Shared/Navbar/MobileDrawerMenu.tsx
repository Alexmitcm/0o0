import {
  ChevronDownIcon,
  Squares2X2Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import type { AccountFragment } from "@hey/indexer";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { productCategories } from "@/components/Products/productsData";
import AccountLink from "@/components/Shared/Account/AccountLink";
import SingleAccount from "@/components/Shared/Account/SingleAccount";
import Bookmarks from "@/components/Shared/Navbar/NavItems/Bookmarks";
import Groups from "@/components/Shared/Navbar/NavItems/Groups";
import Logout from "@/components/Shared/Navbar/NavItems/Logout";
import OnChainDashboardMobile from "@/components/Shared/Navbar/NavItems/OnChainDashboardMobile";
import Settings from "@/components/Shared/Navbar/NavItems/Settings";
import Support from "@/components/Shared/Navbar/NavItems/Support";
import SwitchAccount from "@/components/Shared/Navbar/NavItems/SwitchAccount";
import ThemeSwitch from "@/components/Shared/Navbar/NavItems/ThemeSwitch";
import YourAccount from "@/components/Shared/Navbar/NavItems/YourAccount";
import cn from "@/helpers/cn";
import { useMobileDrawerModalStore } from "@/store/non-persisted/modal/useMobileDrawerModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const MobileDrawerMenu = () => {
  const { currentAccount } = useAccountStore();
  const { setShow: setShowMobileDrawer } = useMobileDrawerModalStore();
  const [showProducts, setShowProducts] = useState<boolean>(false);

  const handleCloseDrawer = () => {
    setShowMobileDrawer(false);
  };

  const handleToggleProducts = useCallback(() => {
    setShowProducts((v) => !v);
  }, []);

  const itemClass = "py-3 hover:bg-gray-100 dark:hover:bg-gray-800";

  return (
    <div className="no-scrollbar fixed inset-0 z-10 size-full overflow-y-auto bg-gray-100 py-4 md:hidden dark:bg-black">
      <button className="px-5" onClick={handleCloseDrawer} type="button">
        <XMarkIcon className="size-6" />
      </button>
      <div className="w-full space-y-2">
        <AccountLink
          account={currentAccount as AccountFragment}
          className="mt-2 flex items-center space-x-2 px-5 py-3 hover:bg-gray-200 dark:hover:bg-gray-800"
          onClick={handleCloseDrawer}
        >
          <SingleAccount
            account={currentAccount as AccountFragment}
            linkToAccount={false}
            showUserPreview={false}
          />
        </AccountLink>
        <div className="bg-white dark:bg-gray-900">
          <div className="divider" />
          <SwitchAccount className={cn(itemClass, "px-4")} />
          <div className="divider" />
        </div>
        <div className="bg-white dark:bg-gray-900">
          <div className="divider" />
          <div>
            <AccountLink
              account={currentAccount as AccountFragment}
              onClick={handleCloseDrawer}
            >
              <YourAccount className={cn(itemClass, "px-4")} />
            </AccountLink>
            <Link onClick={handleCloseDrawer} to="/settings">
              <Settings className={cn(itemClass, "px-4")} />
            </Link>
            <OnChainDashboardMobile
              className={cn(itemClass, "px-4")}
              onClick={handleCloseDrawer}
            />
            <Link onClick={handleCloseDrawer} to="/groups">
              <Groups className={cn(itemClass, "px-4")} />
            </Link>
            {/* Products (collapsible list) */}
            <div className="px-4">
              <button
                aria-expanded={showProducts}
                aria-label="Products"
                className={cn(
                  itemClass,
                  "flex w-full items-center justify-between px-0"
                )}
                onClick={handleToggleProducts}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleProducts();
                  }
                }}
                tabIndex={0}
                type="button"
              >
                <span className="flex items-center space-x-3">
                  <Squares2X2Icon className="size-5" />
                  <span>Products</span>
                </span>
                <ChevronDownIcon
                  className={cn(
                    "size-5 transition-transform",
                    showProducts ? "rotate-180" : undefined
                  )}
                />
              </button>
              {showProducts ? (
                <ul className="pb-2">
                  {productCategories.map((cat) => (
                    <li className="px-2 py-1" key={cat.key}>
                      <div
                        className={[
                          "mb-1",
                          "text-xs",
                          "uppercase",
                          "text-gray-500",
                          "dark:text-gray-400"
                        ].join(" ")}
                      >
                        {cat.title}
                      </div>
                      <ul className="space-y-1">
                        {cat.items.map((p) => (
                          <li key={p.slug}>
                            <Link
                              onClick={handleCloseDrawer}
                              to={`/products/${p.slug}`}
                            >
                              <div className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <p.icon className="size-4" />
                                <span className="text-sm">{p.title}</span>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Link onClick={handleCloseDrawer} to="/gaming-dashboard">
              <div className={cn(itemClass, "px-4")}>
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎮</span>
                  <span>Game Hub</span>
                </div>
              </div>
            </Link>
            <Link onClick={handleCloseDrawer} to="/bookmarks">
              <Bookmarks className={cn(itemClass, "px-4")} />
            </Link>
            <ThemeSwitch
              className={cn(itemClass, "px-4")}
              onClick={handleCloseDrawer}
            />
          </div>
          <div className="divider" />
        </div>
        <div className="bg-white dark:bg-gray-900">
          <div className="divider" />
          <Link onClick={handleCloseDrawer} to="/support">
            <Support className={cn(itemClass, "px-4")} />
          </Link>
          <div className="divider" />
        </div>
        <div className="bg-white dark:bg-gray-900">
          <div className="divider" />
          <div className="hover:bg-gray-100 dark:hover:bg-gray-800">
            <Logout
              className={cn(itemClass, "px-4 py-3")}
              onClick={handleCloseDrawer}
            />
          </div>
          <div className="divider" />
        </div>
      </div>
    </div>
  );
};

export default MobileDrawerMenu;
