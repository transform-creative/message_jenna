import { useState, useRef, useMemo, useEffect } from "react";
import { useGSAP } from "@gsap/react"; // Optimized for React
import gsap from "gsap";
import { CheckoutAmount } from "./CheckoutAmount";
import { CheckoutIdentity } from "./CheckoutIdentity";
import { CheckoutCard } from "./CheckoutCard";
import SlideOutModal from "../SlideOutModal";

import {
  calculateCartAmount,
  IdentityFormValues,
  PaymentObject,
  PaymentStepperProps,
} from "./StepperBL";
import { Icon } from "../Icon";

/*************************
 * Custom component built for processing donations
 * @requires 
 * '@stripe/react-stripe-js' & 
 * '@stripe/stripe-js'
 * @example 
 <PaymentStepper
      active={paymentModal.active}
      logo="/logo.png"
      onClose={() =>
        setPaymentModal({
          ...paymentModal,
          active: false,
        })
      }
      context={context}
      title={
        paymentModal.inCartMode
          ? "Checkout cart"
          : "Donation to Organisation"
      }
      cart={cart}
      inCartMode={paymentModal.inCartMode}
      options={[
        { amount: 10 },
        { amount: 30 },
        { amount: 50 },
        { amount: 100 },
        { amount: 200 },
      ]}
      coverageFee={(amt) => {
        return amt / 20;
      }}
      defaultAmount={50}
      successUrl={`${
        process.env.NODE_ENV === "production"
          ? `https://www.${window.location.host}`
          : `http://${window.location.host}`
      }`}
    />
 */
export function PaymentStepper({
  active,
  context,
  options,
  title = "New donation",
  coverageDefaultsToOn = false,
  directDebitLink,
  defaultAmount = 50,
  successUrl,
  logo,
  cart,
  inCartMode,
  minAmount = 500,
  coverageFee,
  onClose,
}: PaymentStepperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(defaultAmount);
  const [identity, setIdentity] = useState<IdentityFormValues>({
    first: "",
    last: "",
    email: "",
    phone: "",
  });
  const [payment, setPayment] = useState<PaymentObject>({
    cents: amount * 100,
    title: title,
    freq: undefined,
    currency: "aud",
    returnUrl: successUrl,
    metadata: {},
  });

  useEffect(() => {
    if (cart && inCartMode) {
      setAmount(calculateCartAmount(cart) / 100);
      setPayment({
        ...payment,
        metadata: { cart, isOrder: true },
        title: title,
        returnUrl: successUrl,
      });
      setStep(1);
    } else setAmount(defaultAmount);
  }, [cart, active]);

  /************************************************
   * GSAP Animation Logic (Scoped to containerRef)
   */
  useGSAP(() => {
    if (active && !inCartMode) {
      gsap.from(".step-content", {
        opacity: 0,
        x: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
    }
  }, [step, active]);

  useEffect(() => {
    setPayment({
      ...payment,
      cents: amount * 100,
    });
  }, [amount]);

  /*****************************************
   *Centralized Handler (Prevents logic drift)
   */
  function handleIdentityChange(
    attr: keyof IdentityFormValues,
    value: any,
  ) {
    setIdentity((prev) => ({
      ...prev,
      [attr]: value,
    }));
  }

  /******************************************************
   * Runs when user checks or unchecks the 'help cover admin fees' box
   */
  function onCoverageChange(amt: number): number {
    return coverageFee ? coverageFee(amt) : 0;
  }

  /******************************
   * Runs after user submits identity form
   */
  function onIdentityNext(identity: IdentityFormValues) {
    setIdentity(identity);
    setStep(2);
  }

  /***********************************************
   * View Switcher (Cleaner than inline ternary hell)
   */
  function renderStep() {
    switch (step) {
      case 0:
        return (
          <CheckoutAmount
            amount={amount}
            minAmount={minAmount}
            options={options}
            setAmount={setAmount}
            defaultAmount={defaultAmount}
            onNext={() => setStep(1)}
            freq={payment.freq || null}
            onFreqChange={(f) =>
              setPayment({
                ...payment,
                freq: f || undefined,
              })
            }
            calculateCoverage={onCoverageChange}
            coverageDefaultsToOn={coverageDefaultsToOn}
            directDebitLink={directDebitLink}
          />
        );
      case 1:
        return (
          <CheckoutIdentity
            identity={identity}
            onIdentityChange={handleIdentityChange}
            onBack={() => setStep(0)}
            onNext={onIdentityNext}
            amount={amount}
          />
        );
      case 2:
        return (
          <CheckoutCard
            context={context}
            identity={identity}
            paymentProps={payment}
            onBack={() => setStep(1)}
          />
        );
      default:
        return null;
    }
  }

  return (
    <SlideOutModal
      active={active}
      width={context.inShrink ? "90vw" : 350}
      onClose={onClose}
      style={{ zIndex: 50 }}
      context={context}
    >
      <div
        ref={containerRef}
        style={{
          overflowY: "auto",
          overflowX: "clip",
          maxHeight: "95%",
        }}
        className="w-100 col between h-100"
      >
        <div>
          {step < 2 && (
            <header className="pb-10 pt-10 gap5 col">
              <div className="row gap5 middle">
                <Icon name="card-outline" size={15} />
                <h4 className="">{title}</h4>
              </div>
              <p className="">
                AUD{" "}
                <strong
                  style={{
                    color: "var(--primary)",
                  }}
                >
                  ${amount.toFixed(2)}
                </strong>
                {payment.freq && ` every ${payment.freq}`}
              </p>
            </header>
          )}
          <div className="step-content">{renderStep()}</div>
        </div>
        <div className="row middle center">
          <img src={logo} style={{ width: 150 }} />
        </div>
      </div>
    </SlideOutModal>
  );
}
