import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import Nav from "./components/Nav";
import styles from "./css/index.css";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "IP Locations",
  viewport: "width=device-width,initial-scale=1",
  description: "Display IP2locations IP ranges on a map and export them"
});

export const links = () => {
  return [{ rel: "stylesheet", href: styles }];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body style={{ display: "flex", flexDirection: "column" }}>
        <Nav />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
