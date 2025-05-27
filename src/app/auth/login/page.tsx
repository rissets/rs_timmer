
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
import { APP_NAME } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }), // Will be translated by FormMessage if error occurs
  password: z.string().min(1, { message: "Password is required" }), // Will be translated by FormMessage
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useLanguageContext();
  const { loginWithEmail, currentUser, loading, error, setError } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!loading && currentUser) {
      router.push('/'); // Redirect if already logged in
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    // Clear Firebase errors if form is touched or values change
    if (form.formState.isDirty || Object.keys(form.formState.touchedFields).length > 0) {
      setError(null);
    }
  }, [form.formState.isDirty, form.formState.touchedFields, setError]);


  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    const user = await loginWithEmail(data.email, data.password);
    if (user) {
      router.push('/');
    } else {
      // Error is set in AuthContext and handled by toast
      // Clear password field on failed login attempt for security
      form.resetField("password");
    }
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
          <CardTitle className="text-2xl">{t('auth.loginTitle', { appName: APP_NAME })}</CardTitle>
          <CardDescription>{t('auth.loginDescription')}</CardDescription>
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.passwordLabel')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('auth.passwordPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && !form.formState.dirtyFields.email && !form.formState.dirtyFields.password && (
                 <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.loggingInButton') : t('auth.loginButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col items-center space-y-2">
          <div className="text-sm">
            <Link href="/auth/forgot-password" legacyBehavior>
              <a className="font-medium text-primary hover:underline">{t('auth.forgotPasswordLink')}</a>
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            {t('auth.noAccountPrompt')}{' '}
            <Link href="/auth/register" legacyBehavior>
              <a className="font-medium text-primary hover:underline">{t('auth.registerLink')}</a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
