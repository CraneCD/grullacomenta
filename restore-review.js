const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function restoreData() {
  try {
    console.log('Restoring data after database reset...');
    
    // First, create a basic admin user
    const hashedPassword = await bcrypt.hash('admin123!', 10);
    
    const user = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@grullacomenta.com',
        password: hashedPassword,
        role: 'admin'
      }
    });
    
    console.log('Created admin user:', user.name);
    
    // Get the full content from the API response you provided
    const fullContent = `Un elemento básico en el anime en el género lleno de acción dirigido a audiencias masculinas jóvenes es el protagonista principal que tiene la tarea de salvar el mundo. Depende de ellos hacer justicia donde no se encuentra, y en su mayoría lo logran. Pero como algunas series demuestran, no todos los protagonistas pueden mantener un agarre tan firme en su sentido de justicia. Light Yagami de Death Note, Eren Jaeger de Shingeki no Kyojin y Lelouch vi Britannia de Code Geass, todos tienen algo en común: su creencia en la justicia cambia y juegan a ser dioses, decidiendo quién y qué merece ser salvado y quién no.

Cada uno tiene su propia forma de atravesar este proceso de salvar a ciertos personajes. Desde una perspectiva externa aparece apropiado porque, en última instancia, están salvando personas. Sin embargo, salvar a una persona siempre tiene un precio, y cada personaje aprende que sus acciones impulsadas por sus complejos de tipo divino tienen un resultado ampliamente negativo.

Un complejo de Dios es definido como un patrón de personalidad en el cual un individuo cree que tiene gran poder o influencia sobre la vida de los demás y que es superior a ellos. Se menciona en múltiples fuentes que cuando alguien es afectado por un complejo de Dios, ellos se pueden volver destructivos y dañinos para aquellos que tienen a su alrededor. Ser capaz de controlar una situación a la fuerza es un gigantesco factor que contribuye a este patrón de personalidad, el cual está arraigado en un profundo sentido de egocentrismo.`;
    
    // Now restore the review with the YouTube URL
    const review = await prisma.review.create({
      data: {
        title: 'El complejo de dios en el Shonen',
        slug: 'el-complejo-de-dios-en-el-shonen',
        content: fullContent,
        contentEs: fullContent,
        contentEn: 'A basic element in anime in the action-packed genre aimed at young male audiences is the main protagonist who has the task of saving the world...',
        category: 'anime',
        platform: null,
        rating: null,
        coverImage: 'https://i9.ytimg.com/vi/idFen8mp7gY/maxresdefault.jpg?v=64889fe6&sqp=CLCX2MEG&rs=AOn4CLBpGVh63kASccJyZEUTJsbXpTuVsw',
        imageData: null,
        imageMimeType: null,
        youtubeUrl: 'https://youtu.be/idFen8mp7gY',
        status: 'published',
        authorId: user.id,
        titleEs: 'El complejo de dios en el Shonen',
        titleEn: 'The God Complex in Shonen'
      }
    });
    
    console.log('✅ Restored review:', review.title);
    console.log('✅ YouTube URL:', review.youtubeUrl);
    console.log('✅ Review ID:', review.id);
    
  } catch (error) {
    console.error('Error restoring data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData(); 