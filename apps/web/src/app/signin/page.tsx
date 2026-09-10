import type { Metadata } from 'next';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { SignIn } from '@/components/sign-in';
import { REFERENCE } from '@/mock/estimates';

export const metadata: Metadata = {
  title: 'Signing in',
  description:
    'Save an estimate with a six-digit code sent by SMS or email. No password, and no account needed to use MIMS.',
};

export default function SignInPage() {
  return (
    <>
      <AppHeader label="Save your estimate" />
      <main>
        <Shell width="app" className="pt-[22px]">
          <PageHeading
            kicker="After the estimate, never before"
            title="Signing in"
            lede="Nobody creates an account to find out what a bumper costs. Estimate first; the account only appears when there is something worth keeping."
            size="md"
          />
          <SignIn reference={REFERENCE} />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
