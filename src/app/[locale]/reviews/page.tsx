import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('Reviews');
  
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ReviewsPage() {
  const t = useTranslations('Reviews');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          {t('title')}
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          {t('description')}
        </p>

        {/* TODO: Add reviews listing component here */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">
              {t('comingSoon')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('reviewsListingMessage')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 