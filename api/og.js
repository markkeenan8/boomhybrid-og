import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const WIDTH = 1080;
const HEIGHT = 1350;
const BG_URL =
  'https://raw.githubusercontent.com/markkeenan8/images/main/boomhybrid_baseimage.png';
const GREEN = '#3dff2e';

// JetBrains Mono to echo the monospace edge strips on the base image.
const FONT_BOLD_URL =
  'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Bold.ttf';
const FONT_REG_URL =
  'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf';

async function loadFont(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

// Tiny helper to build satori element trees without JSX.
function h(type, style, children) {
  return { type, props: { style, children } };
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('text') || 'BOOM HYBRID\nNo workout supplied';

  // Accept both real newlines and literal \n sequences.
  const lines = raw
    .replace(/\\n/g, '\n')
    .split('\n')
    .map((l) => l.trim());

  // First non-empty line is the title; the rest are body lines.
  const firstIdx = lines.findIndex((l) => l.length > 0);
  const title = firstIdx >= 0 ? lines[firstIdx].toUpperCase() : 'BOOM HYBRID';
  const body = firstIdx >= 0 ? lines.slice(firstIdx + 1) : [];

  // Scale text down as the workout gets longer so it never clips.
  const bodyCount = body.filter((l) => l.length > 0).length;
  const longest = Math.max(20, ...body.map((l) => l.length));
  let bodySize = 40;
  if (bodyCount > 10 || longest > 34) bodySize = 34;
  if (bodyCount > 14 || longest > 42) bodySize = 29;
  if (bodyCount > 18 || longest > 52) bodySize = 25;
  const titleSize = Math.min(64, Math.round(bodySize * 1.6));
  const lineGap = Math.round(bodySize * 0.45);

  const [boldFont, regFont] = await Promise.all([
    loadFont(FONT_BOLD_URL),
    loadFont(FONT_REG_URL),
  ]);
  const fonts = [];
  if (boldFont) fonts.push({ name: 'Mono', data: boldFont, weight: 700 });
  if (regFont) fonts.push({ name: 'Mono', data: regFont, weight: 400 });
  const family = fonts.length ? 'Mono' : undefined;

  const bodyChildren = body.map((line) =>
    line.length === 0
      ? h('div', { display: 'flex', height: lineGap * 2 })
      : h(
          'div',
          {
            display: 'flex',
            fontFamily: family,
            fontWeight: 400,
            fontSize: bodySize,
            color: '#ffffff',
            letterSpacing: 1.5,
            textAlign: 'center',
            marginBottom: lineGap,
          },
          line
        )
  );

  const tree = h(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000000',
      backgroundImage: `url(${BG_URL})`,
      backgroundSize: `${WIDTH}px ${HEIGHT}px`,
    },
    [
      h(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 800,
          padding: '48px 56px',
          backgroundColor: 'rgba(0,0,0,0.45)',
          borderRadius: 6,
        },
        [
          h(
            'div',
            {
              display: 'flex',
              fontFamily: family,
              fontWeight: 700,
              fontSize: titleSize,
              color: GREEN,
              letterSpacing: 6,
              textAlign: 'center',
              marginBottom: 14,
            },
            title
          ),
          h('div', {
            display: 'flex',
            width: 220,
            height: 5,
            backgroundColor: GREEN,
            marginBottom: 34,
          }),
          h(
            'div',
            {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            },
            bodyChildren
          ),
        ]
      ),
    ]
  );

  return new ImageResponse(tree, {
    width: WIDTH,
    height: HEIGHT,
    fonts: fonts.length ? fonts : undefined,
  });
}
