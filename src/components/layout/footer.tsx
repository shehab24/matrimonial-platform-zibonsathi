import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-6 w-6 text-green-500 fill-green-500" />
              <span className="text-xl font-bold text-white">জীবনসাথী</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              নিরাপদ ও বিশ্বস্ত ইসলামিক বিবাহ সংযোগ প্ল্যাটফর্ম। আপনার জীবনসাথী খুঁজুন ইসলামিক মূল্যবোধ বজায় রেখে।
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">দ্রুত লিংক</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-green-400 transition-colors">হোম</Link></li>
              <li><Link href="/browse" className="hover:text-green-400 transition-colors">প্রোফাইল খুঁজুন</Link></li>
              <li><Link href="/register" className="hover:text-green-400 transition-colors">নিবন্ধন করুন</Link></li>
              <li><Link href="/login" className="hover:text-green-400 transition-colors">লগইন</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">সহায়তা</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-green-400 transition-colors">আমাদের সম্পর্কে</Link></li>
              <li><Link href="/privacy" className="hover:text-green-400 transition-colors">গোপনীয়তা নীতি</Link></li>
              <li><Link href="/terms" className="hover:text-green-400 transition-colors">শর্তাবলী</Link></li>
              <li><Link href="/contact" className="hover:text-green-400 transition-colors">যোগাযোগ</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>© ২০২৪ জীবনসাথী। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="mt-1">ইসলামিক মূল্যবোধের ভিত্তিতে নির্মিত</p>
        </div>
      </div>
    </footer>
  );
}
