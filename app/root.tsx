import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { NavProgress } from "~/components/NavProgress";
import { siteMeta } from "~/lib/meta";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Space+Grotesk:wght@400..700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
  },
];

export const meta: Route.MetaFunction = () =>
  siteMeta({
    title: "Awesome Stars \u2014 awesome lists with live GitHub star counts",
    description:
      "Browse awesome lists rendered live from GitHub, with star counts and monthly growth trends overlaid on every entry.",
  });

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={`${import.meta.env.BASE_URL}favicon.ico`} sizes="any" />
        <link
          rel="icon"
          type="image/png"
          href={`${import.meta.env.BASE_URL}icon.png`}
        />
        <link
          rel="apple-touch-icon"
          href={`${import.meta.env.BASE_URL}icon.png`}
        />
        <Meta />
        <Links />
      </head>
      <body>
        <NavProgress />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
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
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
