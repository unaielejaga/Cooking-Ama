import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="Cooking Ama - Comparte y cocina recetas" />
        <meta name="theme-color" content="#4A7C59" />
        <meta property="og:title" content="Cooking Ama" />
        <meta property="og:description" content="Comparte y cocina recetas" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <style>{`input:focus, input:focus-visible, textarea:focus, textarea:focus-visible { outline: none !important; box-shadow: none !important; }`}</style>
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js').catch(function () {});
            });
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
