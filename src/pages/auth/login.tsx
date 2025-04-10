import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Login() {
  const [shopDomain, setShopDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if shop is provided in URL
  useEffect(() => {
    const { shop } = router.query;
    if (shop && typeof shop === 'string') {
      setShopDomain(shop);
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate shop domain
    if (!shopDomain) {
      setError('Please enter a shop domain');
      return;
    }

    // Format shop domain
    let formattedShop = shopDomain.trim().toLowerCase();
    
    // Add .myshopify.com if not present
    if (!formattedShop.includes('.myshopify.com')) {
      formattedShop = `${formattedShop}.myshopify.com`;
    }

    setIsLoading(true);
    
    try {
      // Redirect to the auth endpoint
      window.location.href = `/api/auth/login?shop=${formattedShop}`;
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Login | AI Product Description Generator</title>
        <meta name="description" content="Login to the AI Product Description Generator for Shopify" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            <span className="text-gradient">NexusAI</span>
          </h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            AI Product Description Generator
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Generate high-quality product descriptions with AI
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="shop" className="block text-sm font-medium text-gray-700">
                Shopify Store Domain
              </label>
              <div className="mt-1">
                <input
                  id="shop"
                  name="shop"
                  type="text"
                  placeholder="your-store.myshopify.com"
                  required
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Connecting...' : 'Connect to Shopify'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-6">
          <p className="text-center text-sm text-gray-600">
            Need help? <a href="mailto:support@nexusai.com" className="font-medium text-blue-600 hover:text-blue-500">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}