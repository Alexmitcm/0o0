import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition
} from "@headlessui/react";
import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productCategories } from "@/components/Products/productsData";
import cn from "@/helpers/cn";

interface ProductsMegaMenuProps {
  className?: string;
}

const ProductsMegaMenu: React.FC<ProductsMegaMenuProps> = ({
  className = ""
}) => {
  const categories = useMemo(() => productCategories, []);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.trim().toLowerCase();
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q)
        )
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, query]);

  return (
    <Popover as="div" className={cn("relative", className)}>
      <PopoverButton
        aria-label="Products"
        className="rounded-md px-1 py-1 text-white/80 text-xs transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:px-2 sm:text-sm"
      >
        Products
      </PopoverButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel
          anchor="bottom start"
          className="z-50 mt-2 w-[95vw] max-w-[95vw] rounded-xl border border-white/10 bg-black/80 p-2 text-white shadow-xl backdrop-blur-md sm:w-[92vw] sm:max-w-[92vw] sm:p-3 md:w-[720px] md:p-4"
        >
          {({ close }) => (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-3">
                <input
                  aria-label="Search products"
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/30"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  value={query}
                />
              </div>
              {filtered.map((category) => (
                <div key={category.key}>
                  <div
                    className={[
                      "mb-2",
                      "text-xs",
                      "uppercase",
                      "text-white/60"
                    ].join(" ")}
                  >
                    {category.title}
                  </div>
                  <ul className="list-none space-y-1">
                    {category.items.map((item) => (
                      <li key={item.slug}>
                        <Link
                          aria-label={`Go to ${item.title}`}
                          className="flex items-start gap-3 rounded-lg p-2 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                          onClick={() => close()}
                          to={`/products/${item.slug}`}
                        >
                          <span className="mt-0.5 inline-flex items-center justify-center rounded-md bg-white/10 p-1.5">
                            <item.icon className="size-5" />
                          </span>
                          <span className="flex-1">
                            <span className="block font-medium text-sm text-white">
                              {item.title}
                            </span>
                            <span className="block text-sm text-white/70">
                              {item.description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {filtered.length === 0 ? (
                <div className="md:col-span-3">
                  <div className="rounded-lg border border-white/10 bg-black/60 p-4 text-center text-sm text-white/70">
                    No products match your search.
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  );
};

export default ProductsMegaMenu;
