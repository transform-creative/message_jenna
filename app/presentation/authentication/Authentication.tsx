import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext, useSearchParams } from "react-router";
import { useRef, useState } from "react";
import { logError, supabaseSignIn } from "~/database/Auth";
import IonIcon from "@reacticons/ionicons";
import { BeatLoader } from "react-spinners";
import { AuthApiError } from "@supabase/supabase-js";
import OtpPopUp from "./OtpPopUp";
import LabelInput from "../elements/LabelInput/LabelInput";

export interface AuthenticationProps {}

/******************************
 * Authentication component
 * Handles OTP authentication flow for the application
 */
export function Authentication({}: AuthenticationProps) {
  const context: SharedContextProps = useOutletContext();
  const [email, setEmail] = useState<string>();
  const [processStarted, setProcessStarted] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  /*****************************************
   * Handle process of signing user in
   * @returns
   */
  async function signIn() {
    if (!email) return;

    setProcessStarted(true);

    try {
      await supabaseSignIn(email);
      context.popAlert(
        "Account found!",
        "Check your inbox for a login code",
      );
      setSearchParams({ otp: email });
    } catch (error) {
      const authError = error as AuthApiError;
      await logError(authError, ["Login", "authSignIn"]);

      if (authError.code == "otp_disabled") {
        context.popAlert(
          "Could not sign you in",
          "No account with that email address exists",
          true,
        );
      } else
        context.popAlert(
          "Could not sign you in",
          "An unkown error occurred",
          true,
        );
    }
    setProcessStarted(false);
    setEmail(undefined);
    return;
  }

  return (
    <div className="col middle center vh-80 fade-md">
      <div className="col center">
        <div className="col center">
          <img
            className="center w100"
            src="Logo.png"
            style={{ height: "auto", width: 130 }}
          />
          <h1 style={{ fontSize: 40 }} className="mt3 center">
            Sign in please person
          </h1>
        </div>
        <div className="w-100">
          <form
            className="col gap5"
            action="submit"
            onSubmit={(f) => {
              f.preventDefault();
              signIn();
            }}
          >
            <div className="middle center col mt-10">
              <p className="center p-10">
                Enter your email address and we'll send a login code
                to your inbox!
              </p>
            </div>
            <div className="mt-10 mb-10 m-10">
              <LabelInput
                name="Email"
                className="mt-5"
                type="email"
                value={email || ""}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
              />
            </div>
            <div className="m-10">
              <button
                className={`w-100 ${email && "accent"}`}
                type="submit"
              >
                {processStarted == true ? (
                  <BeatLoader size={10} color="var(--bg)" />
                ) : (
                  <div className="row middle center">
                    <IonIcon
                      name="mail"
                      className="mr-10"
                      style={{
                        marginBottom: -2,
                        width: 15,
                        height: 15,
                      }}
                    />
                    <p>Email link</p>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
        <OtpPopUp
          active={!!searchParams.get("otp")}
          onClose={() => {
            (searchParams.delete("otp"),
              setSearchParams(searchParams));
          }}
          email={searchParams.get("otp")}
        />
      </div>
    </div>
  );
}
