import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ModernDashboard from '../../components/dashboard-page';

interface DashboardProps {
  shopOrigin: string | null;
}

export default function Dashboard({ shopOrigin }: DashboardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [shopData, setShopData] = useState<any>(null);
  const [creditsData, setCreditsData] = useState<any>(null);

  // Get shop from URL if not provided as prop
  const shop = shopOrigin || router.query.shop as string;

  useEffect(() => {
    // Redirect to login if no shop is provided
    if (router.isReady && !shop) {
      router.replace('/auth/login');
      return;
    }

    // Fetch shop data and credits
    if (shop) {
      Promise.all([
        fetch('/api/settings', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('shopify_token')}`
          }
        }),
        fetch('/api/credits', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('shopify_token')}`
          }
        })
      ])
        .then(async ([settingsRes, creditsRes]) => {
          if (!settingsRes.ok || !creditsRes.ok) {
            throw new Error('Failed to fetch data');
          }

          const settings = await settingsRes.json();
          const credits = await creditsRes.json();

          setShopData(settings);
          setCreditsData(credits);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching data:', err);
          setError('Failed to load dashboard data. Please try again.');
          setIsLoading(false);
        });
    }
  }, [shop, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Head>
          <title>Dashboard | AI Product Description Generator</title>
          <meta name="description" content="Manage your AI product descriptions" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Head>
          <title>Error | AI Product Description Generator</title>
          <meta name="description" content="Error loading dashboard" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="text-center">
          <div className="w-16 h-16 text-red-500 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Error Loading Dashboard</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render dashboard
  return (
    <>
      <Head>
        <title>Dashboard | AI Product Description Generator</title>
        <meta name="description" content="Manage your AI product descriptions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ModernDashboard 
        shopData={shopData}
        creditsData={creditsData}
        shop={shop}
      />
    </>
  );
}