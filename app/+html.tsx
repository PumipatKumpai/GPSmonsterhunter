import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />

        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        <meta
          name="viewport"
          content="
            width=device-width,
            initial-scale=1,
            maximum-scale=1,
            minimum-scale=1,
            user-scalable=no,
            viewport-fit=cover
          "
        />

        <ScrollViewStyleReset />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              html,
              body,
              #root {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden;
                background: #070c13;
              }

              html {
                position: fixed;
                inset: 0;
              }

              body {
                position: fixed;
                inset: 0;
                overscroll-behavior: none;
                touch-action: pan-x pan-y;
              }

              #root {
                position: fixed;
                inset: 0;
                max-width: 100vw;
                max-height: 100vh;
              }

              * {
                box-sizing: border-box;
              }
            `,
          }}
        />
      </head>

      <body>{children}</body>
    </html>
  );
}
