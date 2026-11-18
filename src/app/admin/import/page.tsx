import { FileInput } from 'lucide-react';
import { BiodataImporter } from '@/components/admin/biodata-importer';

export default function AdminImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-700">
          <FileInput className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">বায়োডাটা ইমপোর্ট</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            টেলিগ্রাম, ফেসবুক বা যেকোনো জায়গা থেকে বায়োডাটার লেখা পেস্ট করুন। AI প্রতিটি তথ্য সঠিক ঘরে বসিয়ে দেবে, আপনি দেখে নিয়ে ইমপোর্ট করবেন।
          </p>
        </div>
      </div>
      <BiodataImporter />
    </div>
  );
}
