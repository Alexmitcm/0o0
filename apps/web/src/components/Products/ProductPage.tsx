import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { productCategories, slugToProduct } from "./productsData";

const ProductPage = () => {
  const params = useParams();
  const slug = params.slug ?? "";

  const product = useMemo(() => slugToProduct[slug], [slug]);

  if (!product) {
    return (
      <section className="mx-auto w-full max-w-5xl px-3 py-10 md:px-6">
        <div className="rounded-xl border border-white/10 bg-black/50 p-6 text-white shadow-md">
          <h1 className="font-semibold text-xl">Product not found</h1>
          <p className="mt-2 text-white/70">
            The product you are looking for does not exist.
          </p>
          <div className="mt-4">
            <Link
              aria-label="Go home"
              className="rounded-lg bg-white px-3 py-2 font-medium text-black text-sm"
              to="/"
            >
              Go Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const Icon = product.icon;

  return (
    <section
      aria-label={`${product.title} product page`}
      className="mx-auto w-full max-w-6xl px-3 py-8 text-white md:px-6"
    >
      <nav aria-label="Breadcrumb" className="text-sm text-white/60">
        <ol className="flex items-center gap-2">
          <li>
            <Link className="hover:text-white" to="/">
              Home
            </Link>
          </li>
          <li className="select-none">/</li>
          <li>
            <Link className="hover:text-white" to="/products/previews">
              Products
            </Link>
          </li>
          <li className="select-none">/</li>
          <li className="text-white">{product.title}</li>
        </ol>
      </nav>

      <header className="mt-6 flex items-center gap-3">
        <span className="inline-flex items-center justify-center rounded-lg bg-white/10 p-2">
          <Icon className="size-6" />
        </span>
        <div>
          <h1 className="font-semibold text-2xl">{product.title}</h1>
          <p className="text-sm text-white/70">{product.description}</p>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="rounded-xl border border-white/10 bg-black/50 p-6 shadow-md">
            <h2 className="font-medium text-lg">Overview</h2>
            <p className="mt-2 text-white/80">
              This is a placeholder overview for {product.title}. Replace with
              real product content when ready.
            </p>
          </div>
        </div>
        <aside>
          <div className="rounded-xl border border-white/10 bg-black/50 p-6 shadow-md">
            <h3 className="font-medium">Other Products</h3>
            <ul className="mt-3 space-y-2">
              {productCategories.map((cat) => (
                <li key={cat.key}>
                  <div className="mb-1 text-white/60 text-xs uppercase">
                    {cat.title}
                  </div>
                  <ul className="space-y-1">
                    {cat.items.map((p) => (
                      <li key={p.slug}>
                        <Link
                          aria-label={`View ${p.title}`}
                          className="flex items-center gap-2 rounded-md px-2 py-1 text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                          to={`/products/${p.slug}`}
                        >
                          <p.icon className="size-4" />
                          <span className="text-sm">{p.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default ProductPage;
