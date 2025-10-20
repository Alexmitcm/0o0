import {
  BoltIcon,
  ChartBarIcon,
  CursorArrowRaysIcon,
  LockClosedIcon,
  RocketLaunchIcon,
  SparklesIcon,
  Square3Stack3DIcon,
  WrenchScrewdriverIcon
} from "@heroicons/react/24/outline";

export interface ProductItem {
  slug: string;
  title: string;
  description: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  category: string;
}

export interface ProductCategory {
  key: string;
  title: string;
  items: ProductItem[];
}

export const productCategories: ProductCategory[] = [
  {
    items: [
      {
        category: "DX Platform",
        description: "Preview every change with instant shareable links.",
        icon: RocketLaunchIcon,
        slug: "previews",
        title: "Previews"
      },
      {
        category: "DX Platform",
        description: "Ship AI features with robust tooling and guardrails.",
        icon: SparklesIcon,
        slug: "ai",
        title: "AI"
      }
    ],
    key: "dx-platform",
    title: "DX Platform"
  },
  {
    items: [
      {
        category: "Managed Infrastructure",
        description: "Fast, scalable rendering for any app.",
        icon: Square3Stack3DIcon,
        slug: "rendering",
        title: "Rendering"
      },
      {
        category: "Managed Infrastructure",
        description: "Trace every step from edge to database.",
        icon: ChartBarIcon,
        slug: "observability",
        title: "Observability"
      },
      {
        category: "Managed Infrastructure",
        description: "Scale without compromising security.",
        icon: LockClosedIcon,
        slug: "security",
        title: "Security"
      }
    ],
    key: "managed-infrastructure",
    title: "Managed Infrastructure"
  },
  {
    items: [
      {
        category: "Open Source",
        description: "The React framework for production.",
        icon: CursorArrowRaysIcon,
        slug: "nextjs",
        title: "Next.js"
      },
      {
        category: "Open Source",
        description:
          "High‑performance build system for JavaScript and TypeScript.",
        icon: BoltIcon,
        slug: "turborepo",
        title: "Turborepo"
      },
      {
        category: "Open Source",
        description: "Toolkit for building AI features with TypeScript.",
        icon: WrenchScrewdriverIcon,
        slug: "ai-sdk",
        title: "AI SDK"
      }
    ],
    key: "open-source",
    title: "Open Source"
  }
];

export const allProducts: ProductItem[] = productCategories.flatMap(
  (c) => c.items
);

export const slugToProduct: Record<string, ProductItem> = allProducts.reduce(
  (acc, item) => {
    acc[item.slug] = item;
    return acc;
  },
  {} as Record<string, ProductItem>
);
