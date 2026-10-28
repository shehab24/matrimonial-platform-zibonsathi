import { getTranslations } from 'next-intl/server';
import type bn from '../../messages/bn.json';

export type ActionErrorKey = keyof (typeof bn)['errors'];

/** Localized error message for server actions, in the visitor's current language */
export async function actionError(key: ActionErrorKey) {
  const t = await getTranslations('errors');
  return t(key);
}
