import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import {
  AlertType,
  PopAlertFn,
  SharedContextProps,
} from "./data/CommonTypes";
import { supabaseSignOut } from "./database/Auth";
import Alert from "./presentation/elements/Alert";
import { RefObject, useEffect, useRef, useState } from "react";
import { supabase } from "./database/SupabaseClient";
import { Session } from "@supabase/supabase-js";
import { NavBar } from "./presentation/elements/NavBar";
import { CONTACT } from "./data/Objects";
import { PaymentStepper } from "./presentation/elements/PaymentStepper/PaymentStepper";


export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
rel: "stylesheet",
href: "https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css"
}
];

export function HydrateFallback() {
  return (
    <div
      style={{ width: "100%", height: "100vh" }}
      className="col middle center"
    >
      Loading...
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigate = useNavigate();
  const shrinkWidth = 1200;


  const [alert, setAlert] = useState<AlertType>({ active: false });
  const [session, setSession] = useState<Session | null>();
  const [inShrink, setInShrink] = useState(
    window.innerWidth < shrinkWidth,
  );

  useEffect(() => {
    // Get screen width
    const handleResize = () => {
      setInShrink(window.innerWidth < shrinkWidth);
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // Auth actions
    supabase.auth.onAuthStateChange((_event, session) => {
      if (_event == "SIGNED_IN" || _event == "TOKEN_REFRESHED") {
        //Perform sign in actions here
      }
      setSession(session);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /** Activate the saved popup box */
  const popAlert: PopAlertFn = (header, body, isError = false) => {
    setAlert({
      active: true,
      header: header,
      body: body,
      state: isError ? "fail" : "success",
    });
  };

  const context = {
    popAlert: popAlert,
    session,
    inShrink,
    navigate,
  } as SharedContextProps;

  return (
    <>
      <NavBar
        context={
          context
        }
      />
      <Outlet
        context={
          context
        }
      />
      <Alert
        header={alert.header}
        body={alert.body}
        active={alert.active}
        onClose={() => setAlert({ active: false })}
        state={alert.state}
      />
    </>
  );
}

/***************************************
 * The app goes here if an unrecoverable error occurs
 * @returns
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something went wrong!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="w-100 col middle center vh-80 gap10">
      <h1 className="center" style={{ fontSize: "3em" }}>
        {message}
      </h1>
      <h3 className="center">{details}</h3>
      <p className="center">
        Contact {CONTACT.devEmail} if the issue persists.
      </p>
      {stack && process.env.NODE_ENV === "development" && (
        <pre className="center">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
