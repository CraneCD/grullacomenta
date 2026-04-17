import { z } from 'zod';

// Coerce empty strings to undefined for optional text fields.
// The form sends '' for unfilled optional inputs; Zod's .optional() only
// accepts undefined, so '' would otherwise fail min-length checks.
const optionalText = (min: number, max: number) =>
  z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(min).max(max).optional()
  );

// Coerce empty strings to null for optional nullable URL fields.
const optionalUrl = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().url().optional().nullable()
);

// Review validation schema
export const reviewSchema = z.object({
  title: z.string().min(3).max(200),
  titleEs: optionalText(3, 200),
  titleEn: optionalText(3, 200),
  content: z.string().min(10).max(50000),
  contentEs: optionalText(10, 50000),
  contentEn: optionalText(10, 50000),
  category: z.string().min(1),
  platform: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().optional().nullable()
  ),
  rating: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  }).refine((val) => val === undefined || (val >= 0 && val <= 10), {
    message: "Rating must be between 0 and 10"
  }).optional(),
  coverImage: optionalUrl,
  imageData: z.string().optional().nullable(),
  imageMimeType: z.string().optional().nullable(),
  youtubeUrl: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().url().optional().nullable().refine((val) => {
      if (!val) return true;
      return val.includes('youtube.com/watch?v=') || val.includes('youtu.be/') || val.includes('youtube.com/embed/');
    }, {
      message: "Must be a valid YouTube URL"
    })
  ),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

// User validation schema
export const userSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  }),
  role: z.enum(['user', 'admin']).default('user'),
});

// Search validation schema
export const searchSchema = z.object({
  q: z.string().min(1).max(100),
});

// Category validation schema
export const categorySchema = z.object({
  category: z.string().min(1).max(50),
});

// Platform validation schema
export const platformSchema = z.object({
  platform: z.string().min(1).max(50),
});

// File upload validation schema
export const fileUploadSchema = z.object({
  image: z.instanceof(File).refine(
    (file: File) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
    { message: 'Only JPEG, PNG, and WebP images are allowed' }
  ).refine(
    (file: File) => file.size <= 5 * 1024 * 1024,
    { message: 'File size must be less than 5MB' }
  ),
});

// Validation helper function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    return { success: false, error: 'Validation failed' };
  }
} 