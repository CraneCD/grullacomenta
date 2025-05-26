import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Maximum image dimensions
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

// Validate image file
export async function validateImage(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}` 
    };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }
  
  return { valid: true };
}

// Process and optimize image
export async function processImage(file: File): Promise<{ 
  data: Buffer; 
  mimeType: string; 
  width: number; 
  height: number;
}> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Calculate new dimensions while maintaining aspect ratio
    let width = metadata.width || 0;
    let height = metadata.height || 0;
    
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    // Process image with sharp
    const processedImage = await sharp(buffer)
      .resize(width, height, { fit: 'inside' })
      .toBuffer();
    
    // Convert to WebP for better compression
    const webpImage = await sharp(processedImage)
      .webp({ quality: 80 })
      .toBuffer();
    
    return {
      data: webpImage,
      mimeType: 'image/webp',
      width,
      height
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

// Handle image upload
export async function handleImageUpload(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Starting image upload process...');
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      console.log('No file provided in form data');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Validate image
    const validation = await validateImage(file);
    if (!validation.valid) {
      console.log('Image validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    console.log('Image validation passed, starting processing...');
    // Process image
    const processedImage = await processImage(file);
    console.log('Image processing completed:', {
      width: processedImage.width,
      height: processedImage.height,
      size: processedImage.data.length
    });
    
    // Convert to base64 for storage
    const base64Data = processedImage.data.toString('base64');
    
    return NextResponse.json({
      imageData: base64Data,
      mimeType: processedImage.mimeType,
      width: processedImage.width,
      height: processedImage.height,
      size: processedImage.data.length
    });
  } catch (error) {
    console.error('Detailed error in image processing:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return NextResponse.json(
      { error: 'Failed to process image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 