import type { MetadataRoute } from "next";

const SITE_URL = "https://www.cantoecor.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/galeria", "/sobre", "/contato", "/pedido"];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
