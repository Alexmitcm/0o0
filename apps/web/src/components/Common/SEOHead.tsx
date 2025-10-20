import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile" | "product";
  tags?: string[];
}

const SEOHead = ({
  title,
  description,
  image,
  url,
  type = "website",
  tags
}: SEOHeadProps) => {
  const siteName = "Hey";
  const defaultTitle = "Hey - Social Media Platform";
  const defaultDescription =
    "Connect, share, and discover on Hey social media platform";

  const seoTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoImage = image || "/logo.png";
  const seoUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta content={seoDescription} name="description" />
      <meta content={seoTitle} property="og:title" />
      <meta content={seoDescription} property="og:description" />
      <meta content={seoImage} property="og:image" />
      <meta content={seoUrl} property="og:url" />
      <meta content={type} property="og:type" />
      <meta content={siteName} property="og:site_name" />
      <meta content="summary_large_image" name="twitter:card" />
      <meta content={seoTitle} name="twitter:title" />
      <meta content={seoDescription} name="twitter:description" />
      <meta content={seoImage} name="twitter:image" />
      {tags && tags.length > 0 && (
        <meta content={tags.join(", ")} name="keywords" />
      )}
    </Helmet>
  );
};

export default SEOHead;
