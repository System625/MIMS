import type { Metadata } from 'next';
import { AccountSettings } from '@/components/account-settings';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Your garage, alerts, details and data.',
};

export default function SettingsPage() {
  return (
    <>
      <AppHeader label="Settings" meta="0803 000 0000" />
      <main>
        <Shell width="app" className="pt-[22px]">
          <PageHeading
            title="Settings"
            lede="Four things only. Your garage is the one that saves real time — a saved car skips vehicle identification entirely."
            size="md"
          />
          <AccountSettings />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
