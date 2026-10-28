'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { User, Mail, Lock, Eye, EyeOff, Loader2, UserPlus, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { GoogleButton } from './google-button';
import { Logo } from '@/components/layout/logo';
import { registerUser } from '@/actions/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'nameMin'),
  email: z.string().email('invalidEmail'),
  password: z.string().min(8, 'passwordMin'),
  confirmPassword: z.string(),
  gender: z.enum(['MALE', 'FEMALE'], { message: 'genderRequired' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'passwordMismatch',
  path: ['confirmPassword'],
});

type RegisterValues = z.infer<typeof registerSchema>;

const inputClass =
  'h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-11 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600';

function MaleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="4" r="2.5" />
      <path d="M9 8h6a1.5 1.5 0 0 1 1.5 1.5V15h-2v7h-5v-7h-2V9.5A1.5 1.5 0 0 1 9 8z" />
    </svg>
  );
}

function FemaleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="4" r="2.5" />
      <path d="M10 8h4c.8 0 1.4.5 1.6 1.2L18 17h-3.5v5h-5v-5H6l2.4-7.8C8.6 8.5 9.2 8 10 8z" />
    </svg>
  );
}

function GenderCard({
  value,
  label,
  icon,
  selected,
  inputProps,
}: {
  value: 'MALE' | 'FEMALE';
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & { ref: React.Ref<HTMLInputElement> };
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 shadow-sm transition-colors ${
        selected ? 'border-green-700 bg-green-50 ring-1 ring-green-700' : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <input type="radio" value={value} className="sr-only" {...inputProps} />
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {icon}
      </span>
      <span className={`flex-1 text-sm font-semibold ${selected ? 'text-green-700' : 'text-gray-800'}`}>{label}</span>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? 'border-green-700' : 'border-gray-300'}`}>
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-green-700" />}
      </span>
    </label>
  );
}

type Step = 'method' | 'about' | 'account';

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const [step, setStep] = useState<Step>('method');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, control, trigger, clearErrors, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });
  const gender = useWatch({ control, name: 'gender' });
  // Step 1 is checked with trigger() rather than a submit, so clear its errors as soon as the field changes
  const genderInput = register('gender', { onChange: () => clearErrors('gender') });

  // Validate only this step's fields before moving on
  const goToAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await trigger(['name', 'gender'])) setStep('account');
  };

  const onSubmit = async (data: RegisterValues) => {
    setIsLoading(true);
    try {
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        gender: data.gender,
      });

      if (!result.success) {
        toast({ variant: 'destructive', title: tc('error'), description: result.error });
        return;
      }

      // Log the new member straight in instead of making them type the same details again
      const login = await signIn('credentials', { email: data.email, password: data.password, remember: 'true', redirect: false });
      toast({ variant: 'success', title: tc('success'), description: t('registerWelcome') });
      if (login?.error) {
        router.push('/login');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const primaryButton =
    'flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-700 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-green-900/20 transition-opacity hover:opacity-95 disabled:opacity-60';

  const stepHeader = (title: string, current: number, back: Step) => (
    <>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => setStep(back)} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-700">
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </button>
        <span className="text-xs font-medium text-gray-500">{t('stepOf', { current, total: 2 })}</span>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-2" aria-hidden="true">
        {[1, 2].map((n) => (
          <span key={n} className={`h-1.5 rounded-full ${n <= current ? 'bg-green-700' : 'bg-gray-200'}`} />
        ))}
      </div>
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">{title}</h1>
    </>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex justify-center">
          <Logo alt={tc('brand')} className="h-12 w-auto" />
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          {step === 'method' && (
            <>
              <h1 className="text-center text-2xl font-bold text-gray-900">{t('registerHeading')}</h1>
              <p className="mt-1 mb-6 text-center text-sm text-gray-500">{t('registerChoose')}</p>
              <div className="space-y-3">
                <GoogleButton enabled={googleEnabled} />
                <button
                  type="button"
                  onClick={() => setStep('about')}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-green-200 bg-green-50 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:bg-green-100"
                >
                  <Mail className="h-5 w-5 text-green-700" />
                  {t('registerWithEmail')}
                </button>
              </div>
            </>
          )}

          {step === 'about' && (
            <form onSubmit={goToAccount} className="space-y-5" noValidate>
              {stepHeader(t('aboutYou'), 1, 'method')}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-800">{t('fullName')}</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input id="name" autoComplete="name" autoFocus placeholder={t('fullNamePlaceholder')} className={inputClass} {...register('name', { onChange: () => clearErrors('name') })} />
                </div>
                {errors.name && <p className="text-sm text-red-600">{tv(errors.name.message ?? '')}</p>}
              </div>

              <fieldset>
                <legend className="mb-2 block text-sm font-semibold text-gray-800">{t('genderIdentity')}</legend>
                <div className="grid grid-cols-2 gap-3">
                  <GenderCard value="MALE" label={tc('male')} icon={<MaleIcon />} selected={gender === 'MALE'} inputProps={genderInput} />
                  <GenderCard value="FEMALE" label={tc('female')} icon={<FemaleIcon />} selected={gender === 'FEMALE'} inputProps={genderInput} />
                </div>
                {errors.gender && <p className="mt-2 text-sm text-red-600">{tv(errors.gender.message ?? '')}</p>}
              </fieldset>

              <button type="submit" className={primaryButton}>
                {tc('next')} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {step === 'account' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {stepHeader(t('accountDetails'), 2, 'about')}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-800">{t('emailLabel')}</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input id="email" type="email" autoComplete="email" autoFocus placeholder={t('emailPlaceholder')} className={inputClass} {...register('email')} />
                </div>
                {errors.email && <p className="text-sm text-red-600">{tv(errors.email.message ?? '')}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-800">{t('password')}</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('passwordMinPlaceholder')}
                    className={inputClass}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    title={showPassword ? t('hidePassword') : t('showPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-800"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{tv(errors.password.message ?? '')}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800">{t('confirmPassword')}</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('confirmPasswordPlaceholder')}
                    className={inputClass}
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-600">{tv(errors.confirmPassword.message ?? '')}</p>}
              </div>

              <button type="submit" disabled={isLoading} className={primaryButton}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {isLoading ? t('registering') : t('registerButton')}
              </button>
            </form>
          )}

          <p className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-600">
            {t('haveAccount')}{' '}
            <Link href="/login" className="font-semibold text-green-700 hover:underline">{t('loginTitle')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
