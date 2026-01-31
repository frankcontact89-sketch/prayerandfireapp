import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DonorStatus {
  isDonor: boolean;
  loading: boolean;
  donationAmount: number | null;
  donationDate: string | null;
}

/**
 * Hook to check if the current user is a $6.99+ donor
 * Donors get unlimited video call and meeting time
 */
export function useDonorStatus(): DonorStatus {
  const [status, setStatus] = useState<DonorStatus>({
    isDonor: false,
    loading: true,
    donationAmount: null,
    donationDate: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function checkDonorStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (isMounted) {
            setStatus({
              isDonor: false,
              loading: false,
              donationAmount: null,
              donationDate: null,
            });
          }
          return;
        }

        // Check for purchases with price >= $6.99 (monthly donation threshold)
        const { data: purchases, error } = await supabase
          .from("purchases")
          .select("price_paid, purchase_date, products!inner(name)")
          .eq("user_id", user.id)
          .gte("price_paid", 6.99)
          .order("purchase_date", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error checking donor status:", error);
          if (isMounted) {
            setStatus({
              isDonor: false,
              loading: false,
              donationAmount: null,
              donationDate: null,
            });
          }
          return;
        }

        const hasDonation = purchases && purchases.length > 0;
        
        if (isMounted) {
          setStatus({
            isDonor: hasDonation,
            loading: false,
            donationAmount: hasDonation ? purchases[0].price_paid : null,
            donationDate: hasDonation ? purchases[0].purchase_date : null,
          });
        }
      } catch (error) {
        console.error("Error in donor status check:", error);
        if (isMounted) {
          setStatus({
            isDonor: false,
            loading: false,
            donationAmount: null,
            donationDate: null,
          });
        }
      }
    }

    checkDonorStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkDonorStatus();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return status;
}
