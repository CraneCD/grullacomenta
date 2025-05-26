import {redirect} from 'next/navigation';
import {defaultLocale} from '@/i18n/request';

// This page only renders when the user is on the root path
export default function RootPage() {
  redirect(`/${defaultLocale}`);
} 