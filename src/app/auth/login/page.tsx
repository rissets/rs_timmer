
"use client";

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLanguageContext } from '@/contexts/language-context';
import { LogoIcon } from '@/components/icons'; // Assuming LogoIcon is your app logo
import { APP_NAME } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useLanguageContext();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = (data) => {
    console.log('Login data:', data);
    // TODO: Implement actual login logic here
    alert(t('auth.loggingInPlaceholder'));
  };

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
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('auth.loggingInButton') : t('auth.loginButton')}
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
