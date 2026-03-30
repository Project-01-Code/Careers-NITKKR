import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');

const today = new Date().toISOString().split('T')[0];

try {
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  
  // Replace all <lastmod> contents with today's date
  const updatedSitemap = sitemap.replace(/<lastmod>.*?<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
  
  fs.writeFileSync(sitemapPath, updatedSitemap);
  console.log(`✅ Sitemap dates updated to ${today}`);
} catch (err) {
  console.error('❌ Error updating sitemap:', err);
}
