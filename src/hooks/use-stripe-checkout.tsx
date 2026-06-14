import { useState, useCallback } from "react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CheckoutOptions {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
  trialDays?: number;
}

export function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: CheckoutOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);
  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const checkoutElement = (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) closeCheckout(); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="max-h-[85vh] overflow-y-auto">
          {isOpen && options ? <StripeEmbeddedCheckout {...options} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
