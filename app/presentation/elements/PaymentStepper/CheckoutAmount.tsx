import { Ref, useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { centsToString, FreqOptions } from "./StepperBL";
import { ErrorLabelType } from "~/data/CommonTypes";
import ErrorLabel from "../ErrorLabel";
import LabelInput from "../LabelInput/LabelInput";

export interface CheckoutAmountProps {
  amount: number;
  freq: FreqOptions;
  freqOptions?: FreqOptions[];
  nodeRef?: Ref<HTMLDivElement | null>;
  options?: { amount: number; impact?: string }[];
  coverageDefaultsToOn: boolean;
  defaultAmount: number;
  directDebitLink?: string;
  minAmount: number;
  onNext: () => void;
  setAmount: (amount: number) => void;
  onFreqChange: (freq: FreqOptions) => void;
  /**When user selects the 'help cover costs button' */
  calculateCoverage: ((amt: number) => number) | undefined;
}

/******************************
 * CheckoutAmount component
 * @todo Create description
 */
export function CheckoutAmount({
  amount,
  options,
  nodeRef,
  freq,
  directDebitLink,
  freqOptions = [null, "week", "month", "year"],
  coverageDefaultsToOn = false,
  defaultAmount,
  minAmount,
  setAmount,
  onFreqChange,
  calculateCoverage,
  onNext,
}: CheckoutAmountProps) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const [hasTyped, setHasTyped] = useState(false);
  const [pillStyle, setPillStyle] = useState({ width: 0, x: 0 });
  const [activeIndex, setActiveIndex] = useState<FreqOptions>(freq);
  const [coverageSelected, setCoverageSelected] = useState(
    coverageDefaultsToOn,
  );
  const [rawAmount, setRawAmount] = useState(amount);
  const [coverageFee, setCoverageFee] = useState(
    calculateCoverage && calculateCoverage(rawAmount || amount),
  );
  const [error, setError] = useState<ErrorLabelType>({
    active: false,
  });

  // We measure the DOM elements to handle different text lengths perfectly
  useEffect(() => {
    const currentButton = buttonsRef.current.find(
      (b) => b?.id === (activeIndex || "one-off"),
    );
    if (currentButton) {
      setPillStyle({
        width: currentButton.offsetWidth,
        x: currentButton.offsetLeft,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    if (rawAmount * 100 < minAmount)
      setError({
        active: true,
        text: `You can not donate less than ${centsToString(minAmount)}`,
      });
    else setError({ active: false });
    setCoverageFee(calculateCoverage && calculateCoverage(rawAmount));
  }, [rawAmount]);

  useEffect(() => {
    setRawAmount(defaultAmount);
  }, []);

  /***********************************
   * Runs when user types into input box
   * @param val
   */
  function onType(val: number) {
    setHasTyped(true);
    onAmountChange(val, coverageSelected);
  }

  /********************************************
   * Calculates the total amount of the donation,
   * taking account the coverage fee
   * @param amt The raw amount (not including coverage fee)
   * @param includeCoverage The coverage fee.
   */
  function onAmountChange(amt: number, includeCoverage: boolean) {
    let finalAmount = amt;
    setRawAmount(amt);

    if (includeCoverage && calculateCoverage)
      finalAmount += calculateCoverage(amt);

    setAmount(finalAmount);
  }

  return (
    <div
      id="checkout-amount-div"
      className="col gap10 mt-10"
      ref={nodeRef}
    >
      <form
        onSubmit={(f) => {
          f.preventDefault();
          onNext();
        }}
      >
        <div className="col gap10 vhv50 between">
          <div className="col gap10">
            {freqOptions.length > 0 && (
              <div
                role="radiogroup"
                aria-label="Payment frequency"
                className="row w-100 gap5 outline r-default mb-10"
                style={{ position: "relative" }}
              >
                <div
                  className="pill"
                  aria-hidden="true"
                  style={{
                    width: `${pillStyle.width}px`,
                    transform: `translateX(${pillStyle.x}px)`,
                  }}
                />
                {freqOptions.map((opt, i) => (
                  <button
                    key={opt}
                    id={opt || "one-off"}
                    /**@ts-ignore */
                    ref={(el) => (buttonsRef.current[i] = el)}
                    type="button"
                    className={`w-100`}
                    role="radio"
                    style={{
                      background: "none",
                      textTransform: "capitalize",
                    }}
                    onClick={(e) => {
                      setActiveIndex(opt);
                      onFreqChange(opt);
                    }}
                  >
                    {`${opt ? `${opt}ly` : "One-off"}`}
                  </button>
                ))}
              </div>
            )}
            <div className="row gap5">
              {options?.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  className={`outline w-100 ${rawAmount === opt.amount && "accent"}`}
                  onClick={() =>
                    onAmountChange(opt.amount, coverageSelected)
                  }
                >
                  ${opt.amount}
                </button>
              ))}
            </div>
          </div>
          <div className="row middle gap5 w-100">
            <LabelInput
              inlineLabel
              name="$"
              className=""
              placeholder="Custom amount"
              value={hasTyped ? rawAmount || "" : ""}
              onChange={(e) =>
                onType(parseFloat(e.target.value) || 0)
              }
              type="number"
            />
          </div>
          <div className="row middle gap5">
            <input
              type="checkbox"
              className="outline"
              checked={coverageSelected}
              onChange={(e) => {
                setCoverageSelected(!coverageSelected);
                onAmountChange(rawAmount, !coverageSelected);
              }}
            />
            <h3
              className="clickable"
              onClick={(e) => {
                setCoverageSelected(!coverageSelected);
                onAmountChange(rawAmount, !coverageSelected);
              }}
            >
              Add ${coverageFee?.toFixed(2)} to help cover admin feess
            </h3>
          </div>
          <div className="mt-10">
            <ErrorLabel
              active={error?.active}
              text={error.text}
              color="var(--danger)"
            />
            <button
              className="accent row middle gap5 center outline-secondary w-100"
              disabled={error.active === true}
            >
              <Icon name="arrow-forward" />
              Next
            </button>
            {directDebitLink && (
              <div className="row middle center gap5">
                <p>Or give </p>
                <a href={directDebitLink}>via direct debit</a>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
