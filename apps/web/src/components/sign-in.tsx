'use client';

import { useState } from 'react';
import {
  Button,
  Kicker,
  Note,
  Panel,
  Segmented,
  SquareList,
  StageTabs,
  TextInput,
  Title,
} from './ui';

/**
 * Signing in — after the estimate, never before.
 *
 * Nobody creates an account to find out what a bumper costs, so the account only
 * appears once there is something worth keeping. The escape hatch ("just give me
 * the WhatsApp link instead") stays on the primary screen rather than being
 * buried, because for most users it is the correct choice.
 *
 * No passwords: a six-digit code by SMS or email. Better Auth is scaffolded in
 * the API (`apps/api/src/auth/auth.config.ts`) and this is the surface it will
 * drive; nothing here talks to it yet.
 */

type Stage = 'signin' | 'verify' | 'expired';
type Channel = 'phone' | 'email';

export function SignIn({ reference }: { reference: string }) {
  const [stage, setStage] = useState<Stage>('signin');
  const [channel, setChannel] = useState<Channel>('phone');
  const [contact, setContact] = useState('');

  const phone = channel === 'phone';
  const target = contact || (phone ? '0803 000 0000' : 'your@email.com');

  return (
    <>
      <div className="mt-[18px]">
        <StageTabs
          label="Sign-in stages"
          value={stage}
          onChange={setStage}
          stages={[
            { value: 'signin', label: 'Sign in' },
            { value: 'verify', label: 'Verify code' },
            { value: 'expired', label: 'Session expired' },
          ]}
        />
      </div>

      <div className="mt-[16px] flex flex-wrap items-start gap-[20px]">
        <Panel
          weight="heavy"
          className="min-w-0 max-w-[520px] flex-[1_1_400px] px-[16px] py-[18px]"
        >
          {stage === 'signin' ? (
            <>
              <Title>Keep estimate {reference}</Title>
              <p className="text-ink-soft mt-[8px] text-[13.5px] leading-[1.55]">
                We&rsquo;ll send a six-digit code. No password to remember, nothing to install.
              </p>

              <Segmented
                className="mt-[16px]"
                label="How to send your code"
                value={channel}
                onChange={setChannel}
                options={[
                  { value: 'phone', label: 'Phone (SMS)' },
                  { value: 'email', label: 'Email' },
                ]}
              />

              <div className="mt-[12px]">
                <Kicker className="text-muted tracking-[0.11em]">
                  {phone ? 'Phone number' : 'Email address'}
                </Kicker>
                <TextInput
                  mono
                  className="mt-[7px] h-[52px]"
                  type={phone ? 'tel' : 'email'}
                  inputMode={phone ? 'tel' : 'email'}
                  aria-label={phone ? 'Phone number' : 'Email address'}
                  placeholder={phone ? '0803 000 0000' : 'your@email.com'}
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                />
                <p className="text-muted mt-[7px] text-[12px] leading-[1.45]">
                  {phone
                    ? 'Nigerian numbers only for now. Standard SMS rates apply.'
                    : 'Use email if your line is patchy — the code arrives either way.'}
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                full
                className="mt-[14px]"
                onClick={() => setStage('verify')}
              >
                Send my code
              </Button>
              <Button
                variant="outline"
                size="md"
                full
                href="/estimate"
                className="mt-[11px] min-h-[46px]"
              >
                Just give me the WhatsApp link instead
              </Button>

              <p className="text-muted mt-[13px] text-[12px] leading-[1.5]">
                Your number is used to sign you in and to send the alerts you ask for. Nothing else,
                and never sold.{' '}
                <a href="/privacy" className="underline">
                  Privacy
                </a>
                .
              </p>
            </>
          ) : null}

          {stage === 'verify' ? (
            <VerifyCode target={target} onDone={() => setStage('expired')} />
          ) : null}

          {stage === 'expired' ? (
            <>
              <span className="border-ink bg-panel-2 inline-flex border-[1.5px] px-[9px] py-[5px] font-mono text-[11px] font-bold uppercase leading-[1.3] tracking-[0.1em]">
                Session ended
              </span>
              <Title className="mt-[11px]">You&rsquo;ve been signed out</Title>
              <p className="text-ink-soft mt-[8px] text-[13.5px] leading-[1.55]">
                For safety we end sessions after 60 days. Nothing has been deleted — your saved
                estimates and vehicles are waiting.
              </p>

              <div className="border-ink mt-[14px] border-[1.5px] bg-white p-[13px]">
                <Kicker className="text-muted-2 tracking-[0.11em]">Still on this account</Kicker>
                <div className="mt-[9px] grid gap-[7px]">
                  {[
                    ['Saved estimates', '4'],
                    ['Vehicles', '2'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-3 text-[13px] leading-[1.4]"
                    >
                      <span className="text-muted">{label}</span>
                      <span className="font-mono text-[13px] font-bold leading-none">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                full
                className="mt-[14px]"
                onClick={() => setStage('signin')}
              >
                Sign in again
              </Button>
              <Button variant="outline" size="md" full href="/" className="mt-[11px] min-h-[46px]">
                Start a new estimate
              </Button>
            </>
          ) : null}
        </Panel>

        <div className="grid min-w-0 max-w-[380px] flex-[1_1_260px] content-start gap-[14px]">
          <Panel className="p-[14px]">
            <Kicker className="text-muted tracking-[0.12em]">What an account gives you</Kicker>
            <SquareList
              className="mt-[11px]"
              items={[
                'Your estimates kept, so you can reopen one at the workshop.',
                'Your cars saved, so you skip identification next time.',
                "An alert when a part we couldn't price gets one.",
              ]}
            />
          </Panel>

          <Note tone="dashed">
            You can use MIMS forever without an account. Estimates stay on your device for 30 days
            and the share link works either way.
          </Note>
        </div>
      </div>
    </>
  );
}

/**
 * Six boxes, one per digit. Typing fills them left to right and backspace walks
 * back — an SMS code on a phone is nearly always typed, not pasted.
 */
function VerifyCode({ target, onDone }: { target: string; onDone: () => void }) {
  const [digits, setDigits] = useState<string[]>(['4', '0', '7', '1', '', '']);

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(-1);
    setDigits((current) => current.map((digit, i) => (i === index ? clean : digit)));
    if (clean) {
      const next = document.getElementById(`code-${index + 1}`);
      if (next instanceof HTMLInputElement) next.focus();
    }
  }

  const complete = digits.every(Boolean);

  return (
    <>
      <Title>Enter the code</Title>
      <p className="text-ink-soft mt-[8px] text-[13.5px] leading-[1.55]">
        Sent to <strong className="font-bold">{target}</strong>. It expires in ten minutes.
      </p>

      <div className="mt-[16px] flex flex-wrap gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            id={`code-${index}`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            aria-label={`Digit ${index + 1} of 6`}
            value={digit}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !digit && index > 0) {
                const previous = document.getElementById(`code-${index - 1}`);
                if (previous instanceof HTMLInputElement) previous.focus();
              }
            }}
            className="border-ink h-[60px] min-w-[46px] flex-[1_1_46px] border-2 bg-white text-center font-mono text-[22px] font-bold leading-none"
          />
        ))}
      </div>

      <Button
        variant="primary"
        size="lg"
        full
        className="mt-[14px]"
        disabled={!complete}
        onClick={onDone}
      >
        Confirm
      </Button>

      <div className="text-muted mt-[13px] flex flex-wrap justify-between gap-x-[18px] gap-y-2 font-mono text-[11px] font-bold uppercase leading-[1.4] tracking-[0.08em]">
        <span>Resend in 0:42</span>
        <button type="button" className="underline">
          Wrong number?
        </button>
      </div>

      <Note tone="flag" className="mt-[16px]">
        No code after a minute on a weak network? Your estimate is still saved to this device —
        signing in only adds it to your account.
      </Note>
    </>
  );
}
