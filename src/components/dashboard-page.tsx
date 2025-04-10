import React, { useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Button,
  ProgressBar,
  Tabs,
  Grid,
  BlockStack,
  InlineStack,
  Text,
  Thumbnail,
  Icon,
  Link, // For navigation within Polaris context if needed
  Box, // Generic container for padding/margins if needed
} from '@shopify/polaris';
import {
  CreditCardIcon,
  ClockIcon,
  ArrowRightIcon,
  AnalyticsIcon, // Replaced TrendingUpIcon
  ReportIcon,    // Replaced BarChartIcon
  ChevronRightIcon,
  CalendarIcon,
  MagicIcon,     // Replaced SparklesIcon
  ExternalIcon, // For upgrade button
  ViewIcon, // Placeholder for ArrowRight on list items
} from '@shopify/polaris-icons';
import { useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge'; // Corrected import path

interface DashboardProps {
  shopData: any; // Keep type loose for now, refine if needed
  creditsData: any; // Keep type loose for now, refine if needed
  shop: string; // shopOrigin passed from _app.tsx
}

const PolarisDashboard: React.FC<DashboardProps> = ({ shopData, creditsData, shop }) => {
  const app = useAppBridge();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelectedTabIndex(selectedTabIndex),
    [],
  );

  const handleNavigation = useCallback((url: string, isExternal = false) => {
    const redirect = Redirect.create(app);
    if (isExternal) {
      redirect.dispatch(Redirect.Action.REMOTE, url);
    } else {
      // Assuming internal paths are relative to the app's root within Shopify Admin
      redirect.dispatch(Redirect.Action.APP, url);
    }
  }, [app]);

  const tabs = [
    { id: 'overview', content: 'Overview' },
    { id: 'analytics', content: 'Analytics' },
  ];

  const recentUpdates = [
    { id: 1, title: "Ergonomic Office Chair", time: "2 hours ago", image: "/api/placeholder/40/40" },
    { id: 2, title: "Leather Sofa - Brown", time: "5 hours ago", image: "/api/placeholder/40/40" },
    { id: 3, title: "Modern Coffee Table", time: "1 day ago", image: "/api/placeholder/40/40" }
  ];

  const creditsAvailable = creditsData?.available || 0;
  const creditsTotal = creditsData?.total || 1; // Avoid division by zero
  const creditsProgress = (creditsAvailable / creditsTotal) * 100;
  const daysUntilReset = creditsData?.daysUntilReset || 0;
  const usageTrend = creditsData?.usageTrend || 0;

  const creditResetDate = new Date();
  creditResetDate.setDate(creditResetDate.getDate() + daysUntilReset);
  const formattedResetDate = creditResetDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Page title="AI Product Description Generator">
      <Layout>
        <Layout.Section>
          <Tabs tabs={tabs} selected={selectedTabIndex} onSelect={handleTabChange}>
            {selectedTabIndex === 0 && ( // Overview Tab
              <Box paddingBlockStart="400">
                <BlockStack gap="500">
                  {/* Stats Grid */}
                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                      <Card roundedAbove="sm">
                        <BlockStack gap="400">
                          <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="200" blockAlign="center">
                              <Icon source={CreditCardIcon} tone="textCritical" /> {/* Adjust tone */}
                              <Text as="h2" variant="headingSm">Available Credits</Text>
                            </InlineStack>
                            <Button
                              variant="tertiary"
                              icon={ExternalIcon}
                              onClick={() => handleNavigation('/dashboard/credits')}
                            >
                              Upgrade Plan
                            </Button>
                          </InlineStack>
                          <BlockStack gap="200">
                            <InlineStack gap="100"> {/* Removed align="baseline" */}
                              <Text as="p" variant="headingXl">{creditsAvailable}</Text>
                              <Text as="p" variant="bodyMd" tone="subdued">/ {creditsTotal} credits</Text>
                            </InlineStack>
                            <ProgressBar progress={creditsProgress} size="small" tone="primary" />
                            <InlineStack align="space-between">
                              <InlineStack gap="100" blockAlign="center">
                                <Icon source={ClockIcon} tone="subdued" />
                                <Text as="span" variant="bodySm" tone="subdued">{daysUntilReset} days until reset</Text>
                              </InlineStack>
                              <InlineStack gap="100" blockAlign="center">
                                <Icon source={AnalyticsIcon} tone="success" /> {/* Adjust tone */}
                                <Text as="span" variant="bodySm" tone="success">{usageTrend}% usage this week</Text>
                              </InlineStack>
                            </InlineStack>
                          </BlockStack>
                        </BlockStack>
                      </Card>
                    </Grid.Cell>

                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                      <Card roundedAbove="sm">
                         <BlockStack gap="400">
                            <InlineStack gap="200" blockAlign="center">
                              <Icon source={ReportIcon} tone="textCritical" /> {/* Adjust tone */}
                              <Text as="h2" variant="headingSm">Generation Performance</Text>
                            </InlineStack>
                            <InlineStack gap="100"> {/* Removed align="baseline" */}
                               <Text as="p" variant="headingXl">98.5%</Text>
                               <Text as="p" variant="bodyMd" tone="subdued">success rate</Text>
                            </InlineStack>
                            <Grid>
                                <Grid.Cell columnSpan={{ xs: 2, sm: 2, md: 2, lg: 4, xl: 4 }}>
                                    <Box background="bg-surface-secondary" padding="200" borderRadius="100">
                                        <Text as="p" variant="bodyXs" tone="subdued">Daily Average</Text>
                                        <Text as="p" variant="headingMd">42</Text>
                                    </Box>
                                </Grid.Cell>
                                <Grid.Cell columnSpan={{ xs: 2, sm: 2, md: 2, lg: 4, xl: 4 }}>
                                     <Box background="bg-surface-secondary" padding="200" borderRadius="100">
                                        <Text as="p" variant="bodyXs" tone="subdued">Processing Time</Text>
                                        <Text as="p" variant="headingMd">4.2s</Text>
                                    </Box>
                                </Grid.Cell>
                                <Grid.Cell columnSpan={{ xs: 2, sm: 2, md: 2, lg: 4, xl: 4 }}>
                                     <Box background="bg-surface-secondary" padding="200" borderRadius="100">
                                        <Text as="p" variant="bodyXs" tone="subdued">This Month</Text>
                                        <Text as="p" variant="headingMd">1,243</Text>
                                    </Box>
                                </Grid.Cell>
                            </Grid>
                         </BlockStack>
                      </Card>
                    </Grid.Cell>
                  </Grid>

                  {/* Recent Updates */}
                  <Card roundedAbove="sm">
                    <BlockStack gap="400">
                       <InlineStack align="space-between" blockAlign="center">
                         <Text as="h2" variant="headingSm">Recent Updates</Text>
                         <Button
                           variant="plain"
                           icon={ChevronRightIcon}
                           onClick={() => handleNavigation('/dashboard/history')}
                         >
                           View All
                         </Button>
                       </InlineStack>
                       <BlockStack gap="300">
                         {recentUpdates.map((update) => (
                           <Box key={update.id} background="bg-surface-secondary" padding="300" borderRadius="200">
                             <InlineStack align="space-between" blockAlign="center" wrap={false}>
                               <InlineStack gap="300" blockAlign="center" wrap={false}>
                                 <Thumbnail source={update.image} alt="" size="small" />
                                 <BlockStack gap="0">
                                   <Text as="p" variant="bodyMd" fontWeight="medium">{update.title}</Text>
                                   <InlineStack gap="100" blockAlign="center">
                                      <Icon source={ClockIcon} tone="subdued" />
                                      <Text as="span" variant="bodySm" tone="subdued">{update.time}</Text>
                                   </InlineStack>
                                 </BlockStack>
                               </InlineStack>
                               <Button variant="plain" icon={ViewIcon} accessibilityLabel={`View details for ${update.title}`} />
                             </InlineStack>
                           </Box>
                         ))}
                       </BlockStack>
                    </BlockStack>
                  </Card>
                </BlockStack>
              </Box>
            )}

            {selectedTabIndex === 1 && ( // Analytics Tab
              <Box paddingBlockStart="400">
                 <Card roundedAbove="sm">
                    <BlockStack gap="400">
                        <Text as="h2" variant="headingSm">Usage Analytics</Text>
                        <Box background="bg-surface-secondary" borderRadius="200" minHeight="160px">
                            <InlineStack align="center" blockAlign="center" gap="200" > {/* Center placeholder */}
                                <Box padding="400">
                                    <Text as="p" tone="subdued">Analytics chart would display here</Text>
                                </Box>
                            </InlineStack>
                        </Box>
                    </BlockStack>
                 </Card>
              </Box>
            )}
          </Tabs>
        </Layout.Section>

        {/* Quick Actions Section */}
        <Layout.Section>
           <Box paddingBlockStart="500">
             <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                    <Card roundedAbove="sm">
                        <BlockStack gap="300">
                            <Text as="h2" variant="headingSm">Bulk Update Collections</Text>
                            <Text as="p" tone="subdued">
                                Efficiently update multiple products at once by selecting entire collections. Save time and maintain consistent branding.
                            </Text>
                            <Box> {/* Added Box for button alignment */}
                                <Button variant="primary" onClick={() => handleNavigation('/dashboard/collections')}>
                                    Start Bulk Update
                                </Button>
                            </Box>
                        </BlockStack>
                    </Card>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                    <Card roundedAbove="sm">
                        <BlockStack gap="300">
                            <Text as="h2" variant="headingSm">Upcoming Schedule</Text>
                            <BlockStack gap="300">
                                <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                                    <InlineStack gap="300" blockAlign="center" wrap={false}>
                                        <Icon source={CalendarIcon} tone="info" /> {/* Adjust tone */}
                                        <BlockStack gap="0">
                                            <Text as="p" fontWeight="medium">Credit Reset</Text>
                                            <Text as="p" variant="bodySm" tone="subdued">{formattedResetDate}</Text>
                                        </BlockStack>
                                    </InlineStack>
                                </Box>
                                <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                                     <InlineStack gap="300" blockAlign="center" wrap={false}>
                                        <Icon source={MagicIcon} tone="info" /> {/* Adjust tone */}
                                        <BlockStack gap="0">
                                            <Text as="p" fontWeight="medium">New AI Model Update</Text>
                                            <Text as="p" variant="bodySm" tone="subdued">Coming next week</Text>
                                        </BlockStack>
                                    </InlineStack>
                                </Box>
                            </BlockStack>
                        </BlockStack>
                    </Card>
                </Grid.Cell>
             </Grid>
           </Box>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default PolarisDashboard;