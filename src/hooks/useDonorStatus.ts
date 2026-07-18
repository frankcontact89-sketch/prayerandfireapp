interface DonorStatus {
  isDonor: boolean;
  loading: boolean;
  donationAmount: number | null;
  donationDate: string | null;
}

/**
 * Historical hook — in-app monetization gating has been removed for
 * App Store compliance (Apple guideline 3.1.1 / 3.2.1 — donations must
 * not unlock digital features). All meeting and video call features are
 * available to every signed-in user without any payment or donation.
 * Kept as a stub so existing call sites keep working.
 */
export function useDonorStatus(): DonorStatus {
  return {
    isDonor: false,
    loading: false,
    donationAmount: null,
    donationDate: null,
  };
}
