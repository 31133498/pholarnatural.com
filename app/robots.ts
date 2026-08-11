import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config'

/**
 * robots.txt (doc §1.1.2): allow everything public, point at the sitemap.
 *
 * The disallowed paths are the admin area and the transactional screens. These are also marked
 * `noindex` in their own metadata — robots.txt stops the crawl, the meta tag stops indexing if a
 * crawler reaches them another way. Both are wanted.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/cart', '/checkout', '/order-confirmation', '/book/confirmation'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
