import type { SharedContextProps } from "~/data/CommonTypes";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Icon } from "../Icon";
import { logError } from "~/database/Auth";
import * as spinners from "react-spinners";
import { CONTACT } from "~/data/Objects";
import { supabase } from "~/database/SupabaseClient";
import { IdentityFormValues, PaymentObject } from "./StepperBL";

const stripePromise = loadStripe(
  "pk_test_51SmoouF65oA4bMfAcMWoXsqKM4BTHoYU8Sj3jL5PaUXmdRKYTJiVtRcx3iSqtSah9TmjOUwilnt0HtBa07oF0SA300VEt8pQyQ",
);

export interface CheckoutCardProps {
  context: SharedContextProps;
  paymentProps: PaymentObject;
  identity: IdentityFormValues;
  onBack: () => void;
}

/******************************
 * CheckoutMenu component
 * @todo Create description
 */
export function CheckoutCard({
  context,
  identity,
  paymentProps,
  onBack,
}: CheckoutCardProps) {
  const [clientSecret, setClientSecret] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleStripeConnect();
  }, []);

  /*******************************************
   * Handle frontent logic of connecting to the stripe API
   */
  async function handleStripeConnect() {
    setLoading(true);
    try {
      const data = await createStripeCheckoutSession(
        paymentProps,
        identity,
      );

      // 2. Save the secret key
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      logError(err);
      context.popAlert(
        "Could not initialize payment system.",
        undefined,
        true,
      );
    }
    setLoading(false);
  }

  /***************************************************
   * Invoke the edge function to create a new checkout session
   */
  async function createStripeCheckoutSession(
    payment: PaymentObject,
    identity: IdentityFormValues,
  ): Promise<{ clientSecret: string }> {
    const { data, error } = await supabase.functions.invoke(
      "stripe-checkout",
      {
        body: { payment, identity },
      },
    );

    if (error) throw error;
    return data;
  }

  return (
    <div>
      {loading ? (
        <div className="w-100 middle center col vh-50">
          <p>Processing your information...</p>
          <spinners.BeatLoader color="var(--primary)" />
        </div>
      ) : clientSecret ? (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{
            clientSecret: clientSecret,
          }}
        >
          <form
            action="submit"
            onSubmit={(f) => {
              f.preventDefault();
            }}
          >
            <EmbeddedCheckout />
          </form>
        </EmbeddedCheckoutProvider>
      ) : (
        <div className="row center middle vh-50 p-10">
          <h3>
            An error occurred setting up your payment. Screenshot this
            and contact {CONTACT.devEmail} for support!
          </h3>
        </div>
      )}
      <button
        className="row w-100 middle center gap5 outline mt-10"
        disabled={loading}
        onClick={onBack}
      >
        <Icon name="arrow-back" />
        Back
      </button>
    </div>
  );
}
