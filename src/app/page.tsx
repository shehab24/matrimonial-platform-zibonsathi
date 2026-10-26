import Link from 'next/link';
import { Heart, Shield, Lock, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const features = [
    { icon: Shield, title: 'নিরাপদ ও বিশ্বস্ত', description: 'সকল প্রোফাইল যাচাই করা হয়। আপনার নিরাপত্তা আমাদের সর্বোচ্চ অগ্রাধিকার।', color: 'text-green-700', bg: 'bg-green-50' },
    { icon: Lock, title: 'গোপনীয়তা সুরক্ষিত', description: 'আপনার যোগাযোগের তথ্য সম্পূর্ণ নিরাপদ। শুধুমাত্র সংযুক্ত ব্যক্তিরা দেখতে পাবেন।', color: 'text-teal-700', bg: 'bg-teal-50' },
    { icon: Users, title: 'পরিবারের সম্পৃক্ততা', description: 'পরিবারের সাথে মিলে সিদ্ধান্ত নেওয়ার সুযোগ। অভিভাবকের যোগাযোগ তথ্য যুক্ত করুন।', color: 'text-blue-700', bg: 'bg-blue-50' },
    { icon: CheckCircle, title: 'যাচাইকৃত প্রোফাইল', description: 'প্রতিটি প্রোফাইল আমাদের দল কর্তৃক যাচাই করা হয় প্রকাশের আগে।', color: 'text-purple-700', bg: 'bg-purple-50' },
  ];

  const steps = [
    { step: '০১', title: 'নিবন্ধন করুন', description: 'বিনামূল্যে অ্যাকাউন্ট তৈরি করুন এবং ইমেইল যাচাই করুন।' },
    { step: '০২', title: 'প্রোফাইল তৈরি করুন', description: 'আপনার বায়োডাটা পূরণ করুন এবং অনুমোদনের জন্য জমা দিন।' },
    { step: '০৩', title: 'সংযোগ স্থাপন করুন', description: 'পছন্দের প্রার্থীকে সংযোগ অনুরোধ পাঠান এবং কথা বলুন।' },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-teal-900 text-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 rounded-full p-4">
              <Heart className="h-12 w-12 text-white fill-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">আপনার জীবনসাথী খুঁজুন</h1>
          <p className="text-xl md:text-2xl text-green-100 mb-4 max-w-3xl mx-auto">ইসলামিক মূল্যবোধ বজায় রেখে আপনার উপযুক্ত জীবনসঙ্গী খুঁজুন</p>
          <p className="text-green-200 text-lg mb-10">নিরাপদ • বিশ্বস্ত • যাচাইকৃত</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-green-800 font-semibold">
              <Link href="/browse">প্রোফাইল খুঁজুন <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10 hover:text-white">
              <Link href="/register">নিবন্ধন করুন</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">কেন জীবনসাথী বেছে নেবেন?</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">আমরা বিশ্বাস করি প্রতিটি মুসলিম পরিবার একটি সুখী ও হালাল বিবাহের যোগ্য।</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className={`inline-flex p-3 rounded-lg ${feature.bg} mb-4`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">কিভাবে শুরু করবেন?</h2>
            <p className="text-lg text-gray-500">মাত্র তিনটি সহজ ধাপে শুরু করুন</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-700 text-white text-xl font-bold mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/register">এখনই শুরু করুন <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-2xl md:text-3xl font-light mb-4 leading-relaxed" dir="rtl">وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا</p>
          <p className="text-green-200 text-lg">"এবং তাঁর নিদর্শনাবলীর মধ্যে এই যে, তিনি তোমাদের জন্য তোমাদের মধ্য থেকে সঙ্গিনী সৃষ্টি করেছেন"</p>
          <p className="text-green-300 text-sm mt-2">— সূরা রূম, আয়াত ২১</p>
        </div>
      </section>
    </div>
  );
}
