const fs = require('fs/promises');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SCRIPTS_DIR = path.join(process.cwd(), 'Scripts');
const DEFAULT_CATEGORY = 'anime';
const DEFAULT_STATUS = 'published';
const DEFAULT_AUTHOR_EMAIL = process.env.IMPORT_AUTHOR_EMAIL || '';

function fileNameToTitle(fileName) {
  return fileName.replace(/\.md$/i, '').trim();
}

function toBaseSlug(input) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getUniqueSlug(baseSlug) {
  let slug = baseSlug || `entry-${Date.now()}`;
  let count = 1;

  // Keep trying until no slug collision is found.
  while (true) {
    const existing = await prisma.review.findUnique({ where: { slug } });
    if (!existing) return slug;
    count += 1;
    slug = `${baseSlug}-${count}`;
  }
}

async function getOrCreateAuthor() {
  if (DEFAULT_AUTHOR_EMAIL) {
    const user = await prisma.user.findUnique({
      where: { email: DEFAULT_AUTHOR_EMAIL },
    });

    if (!user) {
      throw new Error(
        `No user found with IMPORT_AUTHOR_EMAIL=${DEFAULT_AUTHOR_EMAIL}. ` +
          'Create the user first or run without IMPORT_AUTHOR_EMAIL.'
      );
    }

    return user;
  }

  const fallbackUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!fallbackUser) {
    throw new Error(
      'No users found in database. Create an admin/user first, then run import again.'
    );
  }

  return fallbackUser;
}

async function importScripts() {
  const author = await getOrCreateAuthor();
  const dirEntries = await fs.readdir(SCRIPTS_DIR, { withFileTypes: true });
  const markdownFiles = dirEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'es'));

  if (markdownFiles.length === 0) {
    console.log('No markdown files found in Scripts/.');
    return;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const fileName of markdownFiles) {
    const fullPath = path.join(SCRIPTS_DIR, fileName);
    const rawContent = await fs.readFile(fullPath, 'utf8');
    const content = rawContent.trim();
    const title = fileNameToTitle(fileName);

    if (!content || content.length < 10) {
      skipped += 1;
      console.log(`Skipped (too short/empty): ${fileName}`);
      continue;
    }

    const existingByTitle = await prisma.review.findFirst({
      where: {
        OR: [{ title: title }, { titleEs: title }],
      },
      select: { id: true, slug: true },
    });

    if (existingByTitle) {
      await prisma.review.update({
        where: { id: existingByTitle.id },
        data: {
          title,
          titleEs: title,
          content,
          contentEs: content,
          category: DEFAULT_CATEGORY,
          status: DEFAULT_STATUS,
          authorId: author.id,
        },
      });
      updated += 1;
      console.log(`Updated: ${title} (${existingByTitle.slug})`);
      continue;
    }

    const baseSlug = toBaseSlug(title);
    const slug = await getUniqueSlug(baseSlug);

    await prisma.review.create({
      data: {
        title,
        titleEs: title,
        slug,
        content,
        contentEs: content,
        category: DEFAULT_CATEGORY,
        status: DEFAULT_STATUS,
        authorId: author.id,
      },
    });

    created += 1;
    console.log(`Created: ${title} (${slug})`);
  }

  console.log('\nImport completed.');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total processed: ${markdownFiles.length}`);
}

importScripts()
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
