import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Callback() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This page is just a loading screen while the server-side callback
    // processes the OAuth response from Shopify
    
    const { shop } = router.query;
    
    if (router.isReady && shop) {
      // The server-side callback will redirect to the dashboard
      // This is just a fallback in case something goes wrong
      const timer = setTimeout(() => {
        router.replace(`/dashboard?shop=${shop}`);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else if (router.isReady) {
      setError('Invalid callback. Missing shop parameter.');
      setIsLoading(false);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Authorizing | AI Product Description Generator</title>
        <meta name="description" content="Authorizing your Shopify store" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="text-center">
        {isLoading ? (
          <>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Authorizing Your Store</h1>
            <p className="mt-2 text-gray-600">Please wait while we complete the authorization process...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 text-red-500 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Authorization Error</h1>
            <p className="mt-2 text-gray-600">{error || 'An error occurred during authorization.'}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}