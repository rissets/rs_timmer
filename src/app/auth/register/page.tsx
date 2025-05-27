
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

const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }), // Translated by FormMessage
  password: z.string().min(6, { message: "Password must be at least 6 characters" }), // Translated by FormMessage
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match", // Translated by FormMessage
  path: ["confirmPassword"], 
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { t } = useLanguageContext();
  const { registerWithEmail, currentUser, loading, error, setError } = useAuth();
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
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

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    const user = await registerWithEmail(data.name, data.email, data.password);
    if (user) {
      router.push('/');
    } else {
      // Error is set in AuthContext and handled by toast
      form.resetField("password");
      form.resetField("confirmPassword");
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
          <CardTitle className="text-2xl">{t('auth.registerTitle', { appName: APP_NAME })}</CardTitle>
          <CardDescription>{t('auth.registerDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.nameLabel')} ({t('auth.optionalLabel')})</FormLabel>
                    <FormControl>
                      <Input placeholder={t('auth.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.confirmPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('auth.confirmPasswordPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && !Object.keys(form.formState.dirtyFields).length && (
                 <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.registeringButton') : t('auth.registerButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col items-center space-y-2">
          <div className="text-sm text-muted-foreground">
            {t('auth.haveAccountPrompt')}{' '}
            <Link href="/auth/login" legacyBehavior>
              <a className="font-medium text-primary hover:underline">{t('auth.loginLink')}</a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
