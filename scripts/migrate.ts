// @ts-nocheck
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { cars } from '../src/db/schema';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Assuming local wrangler d1 sqlite file
// Path is usually .wrangler/state/v3/d1/<id>/db.sqlite
// Make sure to run this script relative to project root
const d1Dir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const DB_PATH = fs.existsSync(d1Dir) 
    ? fs.readdirSync(d1Dir)
        .filter(f => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
        .map(f => path.join(d1Dir, f))[0]
    : undefined;

if (!DB_PATH) {
    console.error("Local D1 database not found. Please run 'wrangler d1 migrations apply harka-db --local' first.");
    process.exit(1);
}

const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite);

const carsDir = path.join(process.cwd(), 'src/content/cars');
const files = fs.readdirSync(carsDir).filter(f => f.endsWith('.mdx') && f !== 'example.mdx');

for (const file of files) {
    const filePath = path.join(carsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);

    const slug = file.replace('.mdx', '');

    // For local dev, we just simulate the R2 upload by keeping the image string or rewriting it
    // In a real migration we would upload `data.image` to R2 and get the URL back.
    
    console.log(`Migrating ${slug}...`);
    
    db.insert(cars).values({
        id: slug,
        title: data.title,
        image: data.image, // Ideally replaced with R2 URL
        imageAlt: data.imageAlt || "",
        gallery: data.gallery || [],
        videoTourUrl: data.videoTourUrl,
        excerpt: data.excerpt,
        publishDate: new Date(data.publishDate),
        general: data.general,
        history: data.history,
        technical: data.technical,
        efficiency: data.efficiency,
        options: data.options?.features || [],
        security: data.security || {},
        exterior: data.exterior,
        interior: data.interior || {},
        misc: data.misc || {},
    }).run();
}

console.log("Migration complete!");
