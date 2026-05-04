/*************************************************************************
 * This is where we keep types which are regularly used accross projects
 */

import type { Session } from "@supabase/supabase-js";
import { NavigateFunction } from "react-router";

export type PopAlertFn = (
  header: string,
  body?: string,
  isError?: boolean
) => void;

export type AlertType = {
  active: boolean;
  header?: string;
  body?: string;
  state?: "success" | "fail";
};

export interface InputOption {
  value: any;
  label: any;
}

export interface SharedContextProps {
  session: Session | null;
  inShrink: boolean;
  popAlert: PopAlertFn;

  navigate: NavigateFunction;
}

/** An item that can be shown or hidden */
export interface ActivatableElement {
  active: boolean;
  onClose: () => void;
}

export type ErrorLabelType = {
  selector?: string;
  active: boolean;
  text?: string;
  safe?: boolean;
};

/**A table from the supabase database */
interface SupabaseTable {
  id: number;
  created_at: Date;
}

export interface ContextModalElement {
  active: boolean,
  x?: number;
  y?: number;
}
