import { ErrorLabelType, type SharedContextProps } from "~/data/CommonTypes";
import { Icon } from "../Icon";
import { Ref, useState } from "react";

import { IdentityFormValues, identitySchema } from "./StepperBL";
import LabelInput from "../LabelInput/LabelInput";

export interface CheckoutIdentityProps {
  identity: IdentityFormValues;
  amount: number;
  inCartMode?: boolean;
  nodeRef?: Ref<HTMLDivElement | null>;
  onIdentityChange: (
    attr: keyof IdentityFormValues,
    value: string,
  ) => void;
  onBack: () => void;
  onNext: (identity: IdentityFormValues) => void;
}

/******************************
 * CheckoutIdentity component
 * @todo Create description
 */
export function CheckoutIdentity({
  identity,
  nodeRef,
  inCartMode,
  onBack,
  onNext,
}: CheckoutIdentityProps) {
  const [localIdentity, setLocalIdentity] =
    useState<IdentityFormValues>({
      first: "",
      last: "",
      email: "",
      phone: "",
      org: undefined,
    });
    const [error, setError] = useState<ErrorLabelType>({active: false});

  function onIdentityChange(
    key: keyof IdentityFormValues,
    value: string | undefined,
  ) {
    setLocalIdentity({ ...localIdentity, [key]: value });
  }

  function handleSubmit() {
    onNext(localIdentity);
  }

  return (
    <div ref={nodeRef}>
      <form
        id="payment-identity-form"
        onSubmit={(f) => {
          f.preventDefault();
          handleSubmit();
        }}
      >
        <div className="col gap10">
          <div className="row gap5">
            <LabelInput
              id="first"
              name="First name"
              type="fname"
              /**@ts-ignore */
              style={{ minWidth: undefined }}
              placeholder="John"
              className=""
              value={localIdentity.first}
              onChange={(e) => onIdentityChange("first", e.target.value)}
              error={error.selector==="first" ? error.text : ""}
            />
            <LabelInput
              id="last"
              name="Last name"
              type="lname"
              placeholder="Smith"
              className=""
              value={localIdentity.last}
              onChange={(e) => onIdentityChange("last", e.target.value)}
              error={error.selector==="last" ? error.text : ""}
            />
          </div>
          <LabelInput
            id="email"
            name="Email"
            type="email"
            autoComplete="email"
            placeholder="hello@email.com"
            className=""
            value={localIdentity.email}
            onChange={(e) => onIdentityChange("email", e.target.value)}
            error={error.selector==="email" ? error.text : ""}
          />
          <LabelInput
            id="phone"
            name="Phone"
            type="tel"
            placeholder="123456789"
            autoComplete="phone"
            className=""
            value={localIdentity.phone}
            onChange={(e) => onIdentityChange("phone", e.target.value)}
            error={error.selector==="phone" ? error.text : ""}
          />
          <LabelInput
            id="organisation"
            name="Organisation / church"
            placeholder="Some place"
            className=""
            value={localIdentity.org}
            onChange={(e) => onIdentityChange("org", e.target.value)}
            error={error.selector==="org" ? error.text : ""}
          />
        </div>
        <div className="row w-100 gap5 pt-10">
          {!inCartMode && (
            <button
              className="row w-100 middle center gap5 outline"
              onClick={onBack}
              type="button"
            >
              <Icon name="arrow-back" />
              Back
            </button>
          )}
          <button
            type="submit"
            className="row w-100 middle center gap5 accent"
          >
            <Icon name="arrow-forward" />
            Next
          </button>
        </div>
      </form>
    </div>
  );
}
