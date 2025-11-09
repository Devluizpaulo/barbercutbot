
'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CashierDialog } from "../cashier-dialog";

// This is a client-side component that will open the cashier dialog automatically
// when navigated to `/dashboard/[shopId]/cashier`.
export default function CashierPage() {
    const [isCashierOpen, setIsCashierOpen] = useState(true);
    const router = useRouter();
    const params = useParams();
    const shopId = params.shopId as string;

    useEffect(() => {
        // When the dialog is closed by the user, we no longer want to be on the
        // `/cashier` route, so we navigate back to the main appointments page.
        if (!isCashierOpen) {
            router.replace(`/dashboard/${shopId}/appointments`);
        }
    }, [isCashierOpen, router, shopId]);

    // Render the dialog. It will be controlled by its internal state
    // and the effect above.
    return (
        <CashierDialog
            open={isCashierOpen}
            onOpenChange={setIsCashierOpen}
            shopId={shopId}
        />
    );
}

