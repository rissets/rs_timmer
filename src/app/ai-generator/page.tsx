
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useLanguageContext } from '@/contexts/language-context';

// This page is deprecated as its functionality has been moved to the /notebook page.
// It's being kept temporarily with minimal content to prevent build errors.
// It should be removed from the project.

export default function DeprecatedAiGeneratorPage() {
  const router = useRouter();
  const { t } = useLanguageContext();

  React.useEffect(() => {
    // Redirect to the notebook page or home page
    router.replace('/notebook');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <p className="mb-4">
        The AI Generator has been moved. Redirecting...
      </p>
      <Button onClick={() => router.push('/notebook')}>
        {t('buttons.back') || 'Go to Notebook'}
      </Button>
    </div>
  );
}
