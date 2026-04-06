const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Adding multilingual content to existing reviews...');

  // Get all existing reviews
  const reviews = await prisma.review.findMany();

  for (const review of reviews) {
    // Skip if already has multilingual content
    if (review.contentEs || review.contentEn) {
      console.log(`Review "${review.title}" already has multilingual content, skipping...`);
      continue;
    }

    // Create Spanish and English versions based on the original content
    const spanishContent = `${review.content}\n\n[Contenido en español] Esta es una versión en español de la reseña. El contenido original ha sido adaptado para lectores hispanohablantes.`;
    
    const englishContent = `${review.content}\n\n[English content] This is an English version of the review. The original content has been adapted for English-speaking readers.`;

    try {
      await prisma.review.update({
        where: { id: review.id },
        data: {
          contentEs: spanishContent,
          contentEn: englishContent
        }
      });
      
      console.log(`✅ Updated review: "${review.title}"`);
    } catch (error) {
      console.error(`❌ Error updating review "${review.title}":`, error);
    }
  }

  console.log('Multilingual content update completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 