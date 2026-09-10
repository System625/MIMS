'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useEstimateFlow } from '@/lib/estimate-flow';
import { ZONES } from '@/mock/zones';
import { Button, cx, Kicker, Note, Panel, StageTabs, Title } from './ui';

/**
 * Photos — optional, and built to keep looking optional.
 *
 * SKIP stays visible in the header at every stage, the estimate is never gated
 * on an upload, and the data cost is stated in megabytes because the user is on
 * a metered connection and deserves to make that trade knowingly. Uploads run in
 * the background and survive a dropped signal: the person taking these photos is
 * frequently standing beside a damaged car on a roadside.
 */

type Stage = 'guide' | 'review' | 'upload';

interface Shot {
  id: number;
  label: string;
  tags: string[];
  tag: string;
}

const SUGGESTED: ReadonlyArray<Omit<Shot, 'id'>> = [
  { label: 'FRONT · WIDE', tags: ['Front bumper', 'Hood'], tag: 'Front bumper' },
  { label: 'BUMPER · CLOSE', tags: ['Front bumper', 'Headlight L'], tag: 'Front bumper' },
  { label: 'ENGINE BAY', tags: ['Radiator', 'Hood'], tag: 'Radiator' },
];

const GUIDANCE = [
  {
    frame: ['WIDE', 'WHOLE FRONT'],
    title: 'One step back',
    note: 'Whole damaged end of the car, straight on.',
  },
  {
    frame: ['CLOSE', 'EACH PANEL'],
    title: 'Close on the damage',
    note: 'One per panel you marked. Cracks show better at an angle.',
  },
  {
    frame: ['UNDER', 'THE HOOD'],
    title: 'Open the bonnet',
    note: 'Only if you marked the radiator, and only if it is safe.',
  },
] as const;

export function PhotoUpload() {
  const router = useRouter();
  const { zoneCodes, setPhotoCount } = useEstimateFlow();
  const [stage, setStage] = useState<Stage>('guide');
  const [shots, setShots] = useState<Shot[]>([]);

  // The count is written through to the flow store as it changes, so the damage
  // screen's photo prompt reflects reality when the user goes back to it.
  function commit(next: Shot[]) {
    setShots(next);
    setPhotoCount(next.length);
  }

  // Tag options come from what the user actually ticked, so nobody is asked to
  // label a photo against a panel they never claimed was damaged.
  const zoneOptions = ZONES.filter((zone) => zoneCodes.includes(zone.code)).map(
    (zone) => zone.name,
  );

  function addShot() {
    const suggestion = SUGGESTED[shots.length % SUGGESTED.length];
    const tags = zoneOptions.length > 0 ? zoneOptions.slice(0, 3) : (suggestion?.tags ?? []);
    commit([
      ...shots,
      {
        id: Date.now() + shots.length,
        label: suggestion?.label ?? 'PHOTO',
        tags,
        tag: tags[0] ?? zoneOptions[0] ?? 'Front bumper',
      },
    ]);
    setStage('review');
  }

  const sizeMb = (shots.length * 0.38).toFixed(1);

  return (
    <>
      <div className="mt-[18px]">
        <StageTabs
          label="Photo stages"
          value={stage}
          onChange={setStage}
          stages={[
            { value: 'guide', label: 'Guidance' },
            { value: 'review', label: 'Review' },
            { value: 'upload', label: 'Uploading' },
          ]}
        />
      </div>

      <div className="mt-[16px] flex flex-wrap items-start gap-[20px]">
        <Panel weight="heavy" className="min-w-0 flex-[2_1_460px] px-[16px] py-[18px]">
          {stage === 'guide' ? (
            <>
              <Title className="text-[18px] leading-[1.2]">Three photos are plenty</Title>
              <p className="text-ink-soft mt-[8px] text-[13.5px] leading-[1.55]">
                Stand back far enough that the whole damaged area is in frame. Daylight, no flash.
                If the car is on a busy road, get your own safety right first — the estimate does
                not need this.
              </p>

              <div className="mt-[16px] grid gap-[12px] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
                {GUIDANCE.map((card) => (
                  <div key={card.title} className="border-ink border-[1.5px] bg-white">
                    <div className="hatch border-ink text-stone flex h-[104px] items-center justify-center border-b-[1.5px] text-center font-mono text-[11px] font-bold leading-[1.4] tracking-[0.09em]">
                      {card.frame[0]}
                      <br />
                      {card.frame[1]}
                    </div>
                    <div className="p-[10px]">
                      <div className="text-[13px] font-bold uppercase leading-[1.25]">
                        {card.title}
                      </div>
                      <div className="text-muted mt-[4px] text-[12px] leading-[1.45]">
                        {card.note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-[16px] flex flex-wrap gap-[10px]">
                <Button
                  variant="primary"
                  size="lg"
                  className="min-h-[52px] flex-[1_1_200px]"
                  onClick={addShot}
                >
                  Take a photo
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="min-h-[52px] flex-[1_1_200px] border-2"
                  onClick={addShot}
                >
                  Choose from gallery
                </Button>
              </div>
            </>
          ) : null}

          {stage === 'review' ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <Title className="text-[18px] leading-[1.2]">
                  {shots.length} photo{shots.length === 1 ? '' : 's'} ready
                </Title>
                <Kicker as="span" className="text-muted tracking-[0.09em]">
                  {sizeMb} MB after compression
                </Kicker>
              </div>
              <p className="text-ink-soft mt-[8px] text-[13px] leading-[1.5]">
                Tag each one with the panel it shows — that is what makes them useful. Remove
                anything blurry.
              </p>

              <div className="mt-[14px] grid gap-[12px] [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
                {shots.map((shot) => (
                  <div key={shot.id} className="border-ink border-[1.5px] bg-white">
                    <div className="hatch border-ink relative flex h-[120px] items-center justify-center border-b-[1.5px]">
                      <span className="text-stone font-mono text-[11px] font-bold leading-[1.4] tracking-[0.09em]">
                        {shot.label}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove photo ${shot.label}`}
                        onClick={() => commit(shots.filter((s) => s.id !== shot.id))}
                        className="bg-panel border-ink absolute right-[6px] top-[6px] flex h-[30px] w-[30px] items-center justify-center border-[1.5px] font-mono text-[13px] font-bold leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="px-[10px] py-[9px]">
                      <Kicker className="text-muted-2 tracking-[0.1em]">Shows</Kicker>
                      <div className="mt-[6px] flex flex-wrap gap-[6px]">
                        {shot.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            aria-pressed={shot.tag === tag}
                            onClick={() =>
                              setShots((c) => c.map((s) => (s.id === shot.id ? { ...s, tag } : s)))
                            }
                            className={cx(
                              'border-ink flex min-h-[34px] items-center border-[1.5px] px-[9px] text-[11.5px] font-bold uppercase leading-none',
                              shot.tag === tag ? 'bg-flag text-flag-ink' : 'text-ink bg-white',
                            )}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addShot}
                  className="border-muted-2 bg-panel-4 flex min-h-[150px] flex-col items-center justify-center gap-2 border-[1.5px] border-dashed"
                >
                  <span className="border-ink flex h-[38px] w-[38px] items-center justify-center border-[1.5px] font-mono text-[17px] font-bold leading-none">
                    +
                  </span>
                  <span className="text-[12px] font-bold uppercase leading-none tracking-[0.04em]">
                    Add another
                  </span>
                </button>
              </div>

              {shots.length > 0 ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="mt-[16px]"
                  onClick={() => setStage('upload')}
                >
                  Upload {shots.length} and continue
                </Button>
              ) : null}
            </>
          ) : null}

          {stage === 'upload' ? (
            <>
              <Title className="text-[18px] leading-[1.2]">Uploading in the background</Title>
              <p className="text-ink-soft mt-[8px] text-[13.5px] leading-[1.55]">
                Your estimate is already being built — photos finish on their own. You can carry on,
                and you can close the page: they resume when you come back.
              </p>

              <div className="mt-[16px] grid gap-[10px]">
                <UploadRow name="Photo 1 · front, wide" status="DONE" percent={100} />
                <UploadRow
                  name="Photo 2 · bumper, close"
                  status="64% · 2.1 MB → 380 KB"
                  percent={64}
                />
                <UploadRow name="Photo 3 · radiator" status="WAITING FOR SIGNAL" percent={null} />
              </div>

              <div className="mt-[16px] flex flex-wrap gap-[10px]">
                <Button
                  variant="primary"
                  size="lg"
                  className="min-h-[52px] flex-[1_1_220px]"
                  onClick={() => router.push('/estimate')}
                >
                  Go to my estimate
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="min-h-[52px] flex-[1_1_180px] border-2"
                  onClick={() => setStage('review')}
                >
                  Cancel uploads
                </Button>
              </div>
            </>
          ) : null}
        </Panel>

        {/* ----------------------------------------------------- sidebar -- */}
        <div className="grid min-w-0 max-w-[380px] flex-[1_1_260px] content-start gap-[14px]">
          <Panel className="p-[13px]">
            <Kicker className="text-muted tracking-[0.12em]">Why we ask</Kicker>
            <p className="text-ink-soft mt-[9px] text-[12.5px] leading-[1.55]">
              Photos are reviewed by us to catch parts a user couldn&rsquo;t see — a bent bonnet
              slam panel behind an intact bumper, for instance. They are not shared with workshops
              or traders.
            </p>
          </Panel>

          <Panel className="p-[13px]">
            <Kicker className="text-muted tracking-[0.12em]">Data use</Kicker>
            <div className="mt-[9px] grid gap-[7px]">
              {[
                ['Compressed before sending', '~380 KB'],
                ['Three photos, roughly', '1.1 MB'],
                ['Kept for', '90 DAYS'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 text-[12.5px] leading-[1.4]">
                  <span className="text-muted">{label}</span>
                  <span className="font-mono text-[12px] font-bold leading-none">{value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Note tone="dashed">
            On a weak connection, skip this. You will get the same prices — we just can&rsquo;t
            double-check them.
          </Note>
        </div>
      </div>
    </>
  );
}

function UploadRow({
  name,
  status,
  percent,
}: {
  name: string;
  status: string;
  /** null means queued with no signal — a hatched bar, not a stalled one at 0%. */
  percent: number | null;
}) {
  const waiting = percent === null;
  return (
    <div className={cx('border-ink border-[1.5px] p-[11px]', waiting ? 'bg-panel-3' : 'bg-white')}>
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-[6px] text-[12px] font-bold uppercase leading-[1.3]">
        <span>{name}</span>
        <span
          className={cx(
            'font-mono text-[11px] leading-none',
            waiting ? 'text-flag-deep' : 'text-muted',
          )}
        >
          {status}
        </span>
      </div>
      {waiting ? (
        <>
          <div className="hatch-unknown border-edge-2 mt-[8px] h-[10px] border-[1.5px]" />
          <p className="text-muted mt-[8px] text-[12px] leading-[1.45]">
            Will retry automatically. Nothing is lost if you leave.
          </p>
        </>
      ) : (
        <div className="border-ink mt-[8px] h-[10px] border-[1.5px]">
          <div className="bg-flag h-full" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}
