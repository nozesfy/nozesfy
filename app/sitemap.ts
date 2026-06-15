import type {MetadataRoute} from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nozesfy.com.br';

const publicRoutes = [
  {url: '', priority: 1.0, changeFrequency: 'weekly' as const},
  {url: '/planos', priority: 0.9, changeFrequency: 'monthly' as const},
  {url: '/contato', priority: 0.7, changeFrequency: 'monthly' as const},
  {url: '/download', priority: 0.6, changeFrequency: 'monthly' as const},
  {url: '/docs', priority: 0.5, changeFrequency: 'monthly' as const},
  {url: '/termos-uso', priority: 0.3, changeFrequency: 'yearly' as const},
  {url: '/politica-privacidade', priority: 0.3, changeFrequency: 'yearly' as const},
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
