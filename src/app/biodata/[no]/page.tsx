import { BiodataDetail } from '@/components/biodata/biodata-detail';

export default async function BiodataPage({ params }: { params: Promise<{ no: string }> }) {
  const { no } = await params;
  return <BiodataDetail slug={decodeURIComponent(no)} />;
}
