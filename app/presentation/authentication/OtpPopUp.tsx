import { useEffect, useState } from "react";
import {
  useNavigate,
  useOutletContext,
} from "react-router";
import {
  ActivatableElement,
  ErrorLabelType,
  SharedContextProps,
} from "~/data/CommonTypes";
import { CONTACT } from "~/data/Objects";
import { logError, SignInWithOtp } from "~/database/Auth";
import { Icon } from "../elements/Icon";
import ErrorLabel from "../elements/ErrorLabel";
import PopUpModal from "../elements/PopUpModal";
export function meta({}) {
  return [{ title: "Login" }, { name: "Login to error reports" }];
}

interface OtpPopUpParams extends ActivatableElement {
  email: string | null;
}

/*********************
 * Allow user to enter an OTP code
 */
export default function OtpPopUp({
  active,
  email,
  onClose,
}: OtpPopUpParams) {
  const context: SharedContextProps = useOutletContext();
  const [otp, setOtp] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [signInError, setSignInError] = useState<ErrorLabelType>({active: false})
  const navigate = useNavigate();

  useEffect(() => {
    if (context.session?.user) {
      const role = context.session.user.user_metadata.role;
      role === "admin" ? navigate("/admin") : navigate("/");
    }
  }, [context.session]);

  /** Handle sign in with OTP */
  async function handleSignIn(otpCode?: string) {
    if (!email || !otpCode) return;

    try {
      setSubmitting(true);
      await SignInWithOtp(email, otpCode);
      context.popAlert("Signed in successfully!");
      window.location.reload();
    } catch (error: any) {
      await logError(error, ["otp", "LoginRoute"]);
      if (error?.code === "otp_expired") {
        setSignInError({active: true, text:  "Your code is invalid or has expired."})
        return;
      }

       setSignInError({active: true, text:  `Error signing you in. 
        Contact ${CONTACT.devEmail} for support`})
        return;
    } finally {
      setSubmitting(false);
    }
  }

  /****************************************
   * Perform input validation on OPT entry
   * @param value
   */
  function handleOtpEnter(value: string) {
    const splitValue = value.split("");
    let isValid = true;

    splitValue.forEach((char, index) => {
      if (
        value.length >= (otp ? otp.length : 0) &&
        (isNaN(parseInt(char)) || value.length > 8)
      ) {
        isValid = false;
        return;
      }
    });

    if (!isValid) return;

    setOtp(value);

    if (value.length === 8) {
      handleSignIn(value);
    }
  }

  return (
    <PopUpModal
      active={active}
      onClose={() => onClose()}
      width={context.inShrink ? "95%" : "30%"}
      disableClickOff
    >
      <div className="" style={{overflow: "hidden"}}>
        <form
          action="submit"
          onSubmit={(e) => {
            e.preventDefault();
            handleSignIn(otp);
          }}
          className="col gap10 middle between"
        >
          <div className="col middle">
            <Icon
              name="mail-outline"
              size={80}
              color="var(--accent)"
            />
          
          </div>
          <div className="m0 w-100 col middle gap10">
              <div className="col middle mb-10">
              <h2 className="mb-10 center">We've sent a code to your email</h2>
              <p>Enter it below to complete your sign in</p>
            </div>
            <input
              className="boxed"
              placeholder="12345678"
              style={{
                fontSize: 24,
                letterSpacing: 12,
                textAlign: "center",
              }}
              value={otp || ""}
              onChange={(e) => handleOtpEnter(e.target.value)}
            />
            <button
              className={`w-100 ${
                otp ? "accent" : "lightButton"
              } row middle center gap10`}
              type="submit"
              disabled={!otp || otp.length < 4 || submitting}
            >
              <Icon name="checkmark-circle"/>
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <ErrorLabel active={signInError.active} text={signInError.text || ""}/>
          </div>
          <div className="row gap5">
            <a
              className="row middle center gap10 lightButton buttonLink"
              href="https://mail.google.com/mail/u/0/#inbox"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="logo-google" />
              <h3>Open gmail</h3>
            </a>
            <a   className="row middle center gap10 lightButton buttonLink"
              href="https://outlook.live.com/mail/0/inbox"
              target="_blank"
              rel="noopener noreferrer">
              <Icon name="logo-microsoft" />
              <h3>Open Outlook</h3>
            </a>
          </div>
        </form>
      </div>
    </PopUpModal>
  );
}
