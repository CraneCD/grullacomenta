import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Force a fresh Prisma client instance
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== DATABASE SYNC ENDPOINT ===');
    
    // Check if required columns exist
    const result = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Review'
      ORDER BY ordinal_position;
    ` as { column_name: string }[];
    
    const columns = result.map(row => row.column_name);
    console.log('Existing columns:', columns);
    
    const requiredColumns = ['titleEs', 'titleEn', 'contentEs', 'contentEn', 'authorId'];
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    console.log('Missing columns:', missingColumns);
    
    // Add missing columns
    for (const column of missingColumns) {
      try {
        console.log(`Adding column: ${column}`);
        
        if (column === 'authorId') {
          await prisma.$executeRaw`ALTER TABLE "Review" ADD COLUMN "authorId" TEXT`;
        } else {
          await prisma.$executeRaw`ALTER TABLE "Review" ADD COLUMN ${column} TEXT`;
        }
        
        console.log(`Added column: ${column}`);
      } catch (error) {
        console.log(`Column ${column} might already exist:`, (error as Error).message);
      }
    }
    
    // Verify final schema
    const finalResult = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Review'
      ORDER BY ordinal_position;
    ` as { column_name: string }[];
    
    const finalColumns = finalResult.map(row => row.column_name);
    
    return NextResponse.json({
      success: true,
      message: 'Database sync completed',
      beforeColumns: columns,
      afterColumns: finalColumns,
      addedColumns: missingColumns
    });
    
  } catch (error) {
    console.error('Database sync error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database sync failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 