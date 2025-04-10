import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface HomeProps {
  shopOrigin: string | null;
}

export default function Home({ shopOrigin }: HomeProps) {
  const router = useRouter();

  useEffect(() => {
    // If shop is provided, redirect to dashboard
    if (shopOrigin) {
      router.replace(`/dashboard?shop=${shopOrigin}`);
    } else {
      // If no shop is provided, redirect to login
      router.replace('/auth/login');
    }
  }, [shopOrigin, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>AI Product Description Generator</title>
        <meta name="description" content="Generate AI-powered product descriptions for your Shopify store" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">AI Product Description Generator</h1>
        <p className="mt-2 text-gray-600">Redirecting to the appropriate page...</p>
      </div>
    </div>
  );
}