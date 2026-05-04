import {
  ActivatableElement,
  SharedContextProps,
} from "~/data/CommonTypes";
import * as z from "zod";

export const identitySchema = z.object({
  first: z
    .string()
    .min(2, "First name is too short"),
  last: z
    .string()
    .min(2, "Last name is too short"),
  email: z.email("Please enter a valid email"),
  // Optional field example:
  org: z.string().optional(),
  // Complex custom validation example:
  phone: z
    .string()
    .regex(
      /^\+?[0-9]{10,15}$/,
      "Invalid phone number"
    ),
});

export type IdentityFormValues = z.infer<
  typeof identitySchema
>;

export type PaymentObject = {
  cents: number;
  title: string;
  currency: string;
  /** For recurring donations only */
  freq?: "week" | "month" | "year";
  returnUrl: string;
  metadata?: {[key: string]: any}
};

export type FreqOptions =
  | "week"
  | "month"
  | "year"
  | null;

export interface PaymentStepperProps extends ActivatableElement {
  context: SharedContextProps;
  /**Pass in a list of values to show as default selection of numbers
   * @param amount The dollar value
   * @param impact (optional) A sentence describing what the donation can do for the organisation
   */
  options?: { amount: number; impact?: string }[];
  /**
   *  Name of the payment
   */
  title?: string;
  /**
   * When true the 'help cover admin costs' button will start on
   */
  coverageDefaultsToOn?: boolean;
  /**
   * The amount of money automatically selected when the stepper first opens
   */
  defaultAmount?: number;
  /**
   * Custom link to user's direct debit details
   */
  directDebitLink?: string;
  /**Page to return to after successful payment */
  successUrl: string;
  /*************************
   * The business logo
   */
  logo?: string;

  /*****************************
   * Set an amount in dollars
   */
  cart?: {
    product: {
    id: number;
    amount: number | null;
    name: string;
    [key: string]: any;},
    quantity: number
  }[];
  /**
   * Set to 'cart mode' if user is checking out
   *  a cart instead of donating. 
   */
  inCartMode?: boolean;
  minAmount?: number;
  /**Function to caluclate an amount to add to donation
   * to help cover admin costs
   */
  coverageFee?: (amt: number) => number;
}

/**************************************
 * Calculate the total of a series of products
 * @param products
 */
export function calculateCartAmount(
  cart: PaymentStepperProps["cart"]
) {
  if(!cart) return NaN;
  let total = 0;

  cart.forEach((p) => {
    total += (p.product.amount || 0)*p.quantity;
  });
  return total;
}

/**********************************************
 * Convert an amount in cents to a dollar amount for displaying
 * @param cents
 */
export function centsToString(cents: number): string {
  if (!cents) return "$NaN";

  return `$${(cents / 100).toFixed(2)}`;
}
