'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Password field with an eye button to show/hide what's typed. Works with react-hook-form's register(). */
const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(({ className, ...props }, ref) => {
  const t = useTranslations('auth');
  const [show, setShow] = React.useState(false);
  const label = show ? t('hidePassword') : t('showPassword');

  return (
    <div className="relative">
      <Input ref={ref} type={show ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={label}
        title={label}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-800"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
