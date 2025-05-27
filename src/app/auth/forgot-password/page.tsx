
"use client";

import React, { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLanguageContext } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { LogoIcon } from '@/components/icons';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }), // Translated by FormMessage
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { t } = useLanguageContext();
  const { sendPasswordReset, currentUser, loading, error, setError } = useAuth();
  const router = useRouter();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });
  
  useEffect(() => {
    if (!loading && currentUser) {
      router.push('/'); // Redirect if already logged in
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    if (form.formState.isDirty || form.formState.touchedFields.email) {
      setError(null);
    }
  }, [form.formState.isDirty, form.formState.touchedFields.email, setError]);

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (data) => {
    await sendPasswordReset(data.email);
    // Toast notification is handled within AuthContext for success/error
    // No redirect needed here, user should check their email.
  };

  if (loading && !currentUser) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (currentUser) return null; // Prevent flash of content if redirecting

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <LogoIcon className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('auth.forgotPasswordTitle')}</CardTitle>
          <CardDescription>{t('auth.forgotPasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.emailLabel')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t('auth.emailPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && !form.formState.dirtyFields.email && (
                 <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.sendingButton') : t('auth.sendResetLinkButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col items-center space-y-2">
          <div className="text-sm">
            <Link href="/auth/login" legacyBehavior>
              <a className="font-medium text-primary hover:underline">{t('auth.backToLoginLink')}</a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
