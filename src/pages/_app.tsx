import { AppProps } from 'next/app';
import { useState, useEffect, useMemo } from 'react';
import { AppProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import translations from '@shopify/polaris/locales/en.json'; // Default English translations
import '@shopify/polaris/build/esm/styles.css';
import '../styles/globals.css'; // Keep your custom globals if needed

function MyApp({ Component, pageProps }: AppProps) {
  const [host, setHost] = useState<string | null>(null);
  const [shopOrigin, setShopOrigin] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensure window object is available
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    const hostParam = urlParams.get('host');
    setShopOrigin(shop);
    setHost(hostParam);
  }, []);

  // App Bridge config requires API key and host
  const appBridgeConfig = useMemo(() => {
    if (!host) return undefined; // Don't configure until host is available
    return {
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '', // Ensure this env var is set
      host: host,
      forceRedirect: true,
    };
  }, [host]);

  // Render nothing or a basic loader server-side or until host is determined
  if (!isClient || !appBridgeConfig) {
    return null; // Or a minimal loader if preferred
  }

  return (
    <AppBridgeProvider config={appBridgeConfig}>
      <AppProvider i18n={translations}>
        {/* Pass shopOrigin down if needed by components */}
        <Component {...pageProps} shopOrigin={shopOrigin} />
      </AppProvider>
    </AppBridgeProvider>
  );
}

export default MyApp;