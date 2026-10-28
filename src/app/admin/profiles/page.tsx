import { redirect } from 'next/navigation';

// The review queue now lives in the biodata list
export default function AdminProfilesPage() {
  redirect('/admin/biodatas?status=PENDING_APPROVAL');
}
