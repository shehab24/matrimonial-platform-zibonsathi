'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { ChevronDown, Layers, MapPin, GraduationCap, Briefcase, User, LayoutGrid, Search, RotateCcw, SlidersHorizontal, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DIVISIONS, EDUCATION_OPTIONS, OCCUPATION_OPTIONS, MAZHAB_OPTIONS, FAMILY_STATUS_OPTIONS, MARITAL_STATUSES } from '@/lib/constants';

export const AGE_MIN = 18;
export const AGE_MAX = 60;

export interface BrowseFilterState {
  biodataNo: string;
  gender: string;
  maritalStatus: string[];
  ageMin: string;
  ageMax: string;
  division: string[];
  district: string;
  education: string[];
  occupation: string[];
  mazhab: string[];
  familyStatus: string[];
}

type ListKey = 'maritalStatus' | 'division' | 'education' | 'occupation' | 'mazhab' | 'familyStatus';
const LIST_KEYS: ListKey[] = ['maritalStatus', 'division', 'education', 'occupation', 'mazhab', 'familyStatus'];
const TEXT_KEYS = ['biodataNo', 'gender', 'ageMin', 'ageMax', 'district'] as const;

export const EMPTY_FILTERS: BrowseFilterState = {
  biodataNo: '', gender: '', maritalStatus: [], ageMin: '', ageMax: '',
  division: [], district: '', education: [], occupation: [], mazhab: [], familyStatus: [],
};

// Filters live in the URL so results can be shared, bookmarked and navigated with Back.
// Multi-select values are comma-joined, which also keeps the home page's single-value links working.
export function filtersFromParams(params: URLSearchParams): BrowseFilterState {
  const f = { ...EMPTY_FILTERS };
  for (const k of TEXT_KEYS) f[k] = params.get(k) ?? '';
  for (const k of LIST_KEYS) f[k] = (params.get(k) ?? '').split(',').filter(Boolean);
  return f;
}

export function filtersToParams(f: BrowseFilterState): URLSearchParams {
  const params = new URLSearchParams();
  for (const k of TEXT_KEYS) if (f[k].trim()) params.set(k, f[k].trim());
  for (const k of LIST_KEYS) if (f[k].length) params.set(k, f[k].join(','));
  return params;
}

export function countActiveFilters(f: BrowseFilterState): number {
  return TEXT_KEYS.filter(k => k !== 'ageMax' && f[k].trim()).length
    + (f.ageMax && !f.ageMin ? 1 : 0)
    + LIST_KEYS.reduce((n, k) => n + f[k].length, 0);
}

type SectionId = 'primary' | 'address' | 'education' | 'profession' | 'personal' | 'others';

interface BiodataFiltersProps {
  value: BrowseFilterState;
  onChange: (f: BrowseFilterState) => void;
  onApply: () => void;
  onReset: () => void;
  onClose?: () => void;
  className?: string;
}

export function BiodataFilters({ value, onChange, onApply, onReset, onClose, className }: BiodataFiltersProps) {
  const t = useTranslations('browse');
  const tc = useTranslations('common');
  const tm = useTranslations('maritalStatus');
  const td = useTranslations('divisions');
  const to = useTranslations('options');
  const format = useFormatter();
  const [open, setOpen] = useState<Record<SectionId, boolean>>({
    primary: true, address: true, education: true, profession: false, personal: false, others: false,
  });
  const activeCount = countActiveFilters(value);

  const set = <K extends keyof BrowseFilterState>(key: K, v: BrowseFilterState[K]) => onChange({ ...value, [key]: v });
  const toggle = (key: ListKey, item: string) =>
    set(key, value[key].includes(item) ? value[key].filter(v => v !== item) : [...value[key], item]);
  const toggleSection = (id: SectionId) => setOpen(o => ({ ...o, [id]: !o[id] }));

  const checks = (key: ListKey, items: readonly string[], label: (v: string) => string) => (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
      {items.map(item => (
        <CheckOption key={item} checked={value[key].includes(item)} onChange={() => toggle(key, item)}>
          {label(item)}
        </CheckOption>
      ))}
    </div>
  );

  // Empty bounds mean "no limit", shown as the slider's ends (18 and 60+)
  const ageLo = Number(value.ageMin) || AGE_MIN;
  const ageHi = Number(value.ageMax) || AGE_MAX;
  const setAges = (lo: number, hi: number) => onChange({
    ...value,
    ageMin: lo <= AGE_MIN ? '' : String(lo),
    ageMax: hi >= AGE_MAX ? '' : String(hi),
  });
  const ageLabel = (a: number) => format.number(a) + (a === AGE_MAX ? '+' : '');
  const ages = Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i);

  return (
    <div className={cn('flex flex-col bg-white', className)}>
      <div className="relative flex items-center justify-center border-b border-gray-200 bg-gray-50/70 px-4 py-3.5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-gray-900">
          <SlidersHorizontal className="h-[18px] w-[18px] text-green-700" />
          {t('allFilters')}
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-700 px-1.5 text-[11px] font-semibold text-white">
              {format.number(activeCount)}
            </span>
          )}
        </h2>
        {onClose && (
          <button type="button" onClick={onClose} aria-label={t('closeFilters')} className="absolute right-3 rounded-full p-1.5 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={e => { e.preventDefault(); onApply(); }}
      >
        <div className="flex-1 overflow-y-auto overscroll-contain [scrollbar-color:var(--color-gray-300)_transparent] [scrollbar-width:thin]">
          <Section title={t('sectionPrimary')} icon={Layers} open={open.primary} onToggle={() => toggleSection('primary')}>
            <Field label={t('biodataNo')}>
              <TextInput value={value.biodataNo} onChange={v => set('biodataNo', v)} placeholder={t('biodataNoPlaceholder')} />
            </Field>
            <Field label={t('lookingFor')}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <CheckOption round checked={value.gender === 'MALE'} onChange={() => set('gender', value.gender === 'MALE' ? '' : 'MALE')}>{tc('groom')}</CheckOption>
                <CheckOption round checked={value.gender === 'FEMALE'} onChange={() => set('gender', value.gender === 'FEMALE' ? '' : 'FEMALE')}>{tc('bride')}</CheckOption>
              </div>
            </Field>
            <Field label={t('maritalStatus')}>
              {checks('maritalStatus', MARITAL_STATUSES, v => tm(v))}
            </Field>
            <Field label={t('ageRange')}>
              <div className="flex items-center justify-center gap-3">
                <AgePill
                  label={t('min')}
                  value={ageLo}
                  options={ages.filter(a => a < ageHi)}
                  format={ageLabel}
                  unit={t('yearUnit')}
                  onChange={a => setAges(a, ageHi)}
                />
                <span className="text-[13px] font-medium text-gray-500">{t('to')}</span>
                <AgePill
                  label={t('max')}
                  value={ageHi}
                  options={ages.filter(a => a > ageLo)}
                  format={ageLabel}
                  unit={t('yearUnit')}
                  onChange={a => setAges(ageLo, a)}
                />
              </div>
              <DualRange min={AGE_MIN} max={AGE_MAX} lo={ageLo} hi={ageHi} onChange={setAges} labels={[t('min'), t('max')]} />
            </Field>
          </Section>

          <Section title={t('sectionAddress')} icon={MapPin} open={open.address} onToggle={() => toggleSection('address')}>
            <Field label={t('division')}>
              {checks('division', DIVISIONS, v => td(v))}
            </Field>
            <Field label={t('district')}>
              <TextInput value={value.district} onChange={v => set('district', v)} placeholder={t('districtPlaceholder')} />
            </Field>
          </Section>

          <Section title={t('sectionEducation')} icon={GraduationCap} open={open.education} onToggle={() => toggleSection('education')}>
            {checks('education', EDUCATION_OPTIONS, v => to(v))}
          </Section>

          <Section title={t('sectionProfession')} icon={Briefcase} open={open.profession} onToggle={() => toggleSection('profession')}>
            {checks('occupation', OCCUPATION_OPTIONS, v => to(v))}
          </Section>

          <Section title={t('sectionPersonal')} icon={User} open={open.personal} onToggle={() => toggleSection('personal')}>
            <Field label={t('mazhab')}>
              {checks('mazhab', MAZHAB_OPTIONS, v => to(v))}
            </Field>
          </Section>

          <Section title={t('sectionOthers')} icon={LayoutGrid} open={open.others} onToggle={() => toggleSection('others')} last>
            <Field label={t('familyStatus')}>
              {checks('familyStatus', FAMILY_STATUS_OPTIONS, v => to(v))}
            </Field>
          </Section>
        </div>

        <div className="flex shrink-0 gap-2.5 border-t border-gray-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onReset}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-300 text-[14px] font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <RotateCcw className="h-4 w-4" />
            {t('clearFilters')}
          </button>
          <button
            type="submit"
            className="flex h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-green-700 text-[14px] font-semibold text-white shadow-sm shadow-green-900/20 transition-colors hover:bg-green-800 active:scale-[0.98]"
          >
            <Search className="h-4 w-4" />
            {t('searchBiodata')}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, icon: Icon, open, onToggle, last, children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  open: boolean;
  onToggle: () => void;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(!last && 'border-b border-gray-200')}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
      >
        <span className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-gray-900">
          <Icon className="h-[18px] w-[18px] text-green-700" />
          {title}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && <div className="space-y-5 px-4 pb-5 pt-0.5">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[13px] font-medium text-gray-500">{label}</p>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition-shadow focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
    />
  );
}

function CheckOption({ checked, onChange, round, children }: {
  checked: boolean;
  onChange: () => void;
  round?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex cursor-pointer select-none items-center gap-2.5 text-[14px] leading-snug text-gray-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center border transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-green-700/15',
          round ? 'rounded-full' : 'rounded-[5px]',
          checked ? 'border-green-700 bg-green-700' : 'border-gray-300 bg-white group-hover:border-green-600'
        )}
      >
        {checked && (round
          ? <span className="h-1.5 w-1.5 rounded-full bg-white" />
          : <Check className="h-3 w-3 text-white" strokeWidth={3} />)}
      </span>
      <span className={cn(checked && 'font-medium text-gray-900')}>{children}</span>
    </label>
  );
}

function AgePill({ label, value, options, format, unit, onChange }: {
  label: string;
  value: number;
  options: number[];
  format: (a: number) => string;
  unit: string;
  onChange: (a: number) => void;
}) {
  return (
    <label className="relative flex h-10 items-center gap-1 rounded-xl border border-gray-200 bg-white pl-3.5 pr-8 shadow-sm transition-colors focus-within:border-green-700 hover:border-green-600">
      <span className="text-[15px] font-semibold text-gray-900">{format(value)}</span>
      <span className="text-[12px] text-gray-500">{unit}</span>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-green-700" />
      <select
        aria-label={label}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map(a => <option key={a} value={a}>{format(a)} {unit}</option>)}
      </select>
    </label>
  );
}

// Two overlapping range inputs form one slider; the tracks are transparent and only the thumbs take pointer events
const RANGE_THUMB = cn(
  'pointer-events-none absolute inset-0 m-0 h-full w-full appearance-none bg-transparent focus:outline-none',
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-grab',
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2',
  '[&::-webkit-slider-thumb]:border-green-700 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md',
  'focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-green-700/20',
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab',
  '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-green-700 [&::-moz-range-thumb]:bg-white',
  '[&::-moz-range-track]:bg-transparent'
);

function DualRange({ min, max, lo, hi, onChange, labels }: {
  min: number;
  max: number;
  lo: number;
  hi: number;
  onChange: (lo: number, hi: number) => void;
  labels: [string, string];
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div className="relative mx-2 h-6">
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-200" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-green-700"
        style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
      />
      <input
        type="range" min={min} max={max} value={lo} aria-label={labels[0]} className={RANGE_THUMB}
        onChange={e => onChange(Math.min(Number(e.target.value), hi - 1), hi)}
      />
      <input
        type="range" min={min} max={max} value={hi} aria-label={labels[1]} className={RANGE_THUMB}
        onChange={e => onChange(lo, Math.max(Number(e.target.value), lo + 1))}
      />
    </div>
  );
}
