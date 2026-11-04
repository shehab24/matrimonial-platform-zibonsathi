// Public biodata pages live at /biodata/<biodata no.> (e.g. /biodata/ZBF-00010). The full ID is needed
// because numbers repeat across the ZBM/ZBF prefixes. Profiles without a number yet fall back to the internal ID.
export function biodataHref(profile: { id: string; oderId: string | null }): string {
  return profile.oderId ? `/biodata/${profile.oderId}` : `/profile/${profile.id}`;
}

// Admin detail pages use the same biodata number; pending biodatas without one fall back to the internal ID.
export function adminBiodataHref(profile: { id: string; oderId: string | null }): string {
  return `/admin/biodatas/${profile.oderId ?? profile.id}`;
}
