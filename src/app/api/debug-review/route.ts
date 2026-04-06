import { NextRequest, NextResponse } from 'next/server';
import { reviewSchema, validateInput } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG REVIEW ENDPOINT ===');
    
    const body = await request.json();
    console.log('Raw body keys:', Object.keys(body));
    console.log('Body structure:', {
      hasTitle: !!body.title,
      hasTitleEs: !!body.titleEs,
      hasTitleEn: !!body.titleEn,
      hasContent: !!body.content,
      hasContentEs: !!body.contentEs,
      hasContentEn: !!body.contentEn,
      category: body.category,
      platform: body.platform,
      status: body.status,
      contentLength: body.content?.length,
      contentEsLength: body.contentEs?.length,
      contentEnLength: body.contentEn?.length
    });
    
    // Test validation
    console.log('Testing validation...');
    const validationResult = validateInput(reviewSchema, body);
    
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error);
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        error: validationResult.error,
        body: body
      }, { status: 400 });
    }
    
    console.log('Validation passed!');
    return NextResponse.json({
      success: true,
      message: 'Validation passed',
      validatedData: validationResult.data
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      message: 'Debug endpoint error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 