import { Helmet } from "react-helmet-async";

const SITE = "https://storyou.ai";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  ogType?: string;
}

export function SEO({ title, description, path, jsonLd, ogType = "website" }: SEOProps) {
  const url = `${SITE}${path}`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
