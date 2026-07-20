/**
 * Branded Instagram/social card renderer (admin-only, ?key= auth since it is
 * loaded from <img> tags in the admin composer).
 *
 * kinds:
 *   deal   — a catalog item: photo, price, $/10g protein stat, savings badge
 *   blog   — a blog post: tag, title, description
 *   custom — free headline + subtext
 * sizes: square 1080x1080 · portrait 1080x1350 · story 1080x1920
 *
 * Every card shares the same frame — logo header, paper background, footer with
 * the site URL — so the feed looks like one consistent brand.
 */
import { ImageResponse } from "next/og";
import { getItemBySlug } from "@/lib/catalog";
import { CATEGORY_BY_SLUG } from "@/lib/catalog/categories";
import { getPostBySlug } from "@/lib/blog";
import { formatPer10g, formatPrice } from "@/lib/format";
import { BODY_FONT, DISPLAY_FONT, getCardFonts } from "@/lib/social/fonts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const C = {
  paper: "#faf7f1",
  surface: "#ffffff",
  ink: "#2c2418",
  muted: "#8b7b65",
  line: "#ebe4d7",
  leaf: "#567b45",
  leafDeep: "#3f5f31",
  leafSoft: "#edf3e7",
  clay: "#c26a45",
  gold: "#8a6414",
  goldSoft: "#faf1dc",
};

const SIZES = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
} as const;
type SizeKey = keyof typeof SIZES;

function authed(req: Request): boolean {
  const key = process.env.ADMIN_KEY ?? process.env.MCP_ADMIN_KEY;
  return !!key && new URL(req.url).searchParams.get("key") === key;
}

function Header({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: C.leaf,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.paper,
            fontSize: 46,
            fontWeight: 700,
            fontFamily: BODY_FONT,
          }}
        >
          $
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 600,
            color: C.ink,
            fontFamily: DISPLAY_FONT,
          }}
        >
          MacroMarket
        </div>
      </div>
      <div
        style={{
          display: "flex",
          background: C.leafSoft,
          color: C.leafDeep,
          borderRadius: 999,
          padding: "12px 26px",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: BODY_FONT,
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Footer({ hint }: { hint: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        borderTop: `2px solid ${C.line}`,
        paddingTop: 34,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 28,
          fontWeight: 700,
          color: C.leafDeep,
          fontFamily: BODY_FONT,
        }}
      >
        macromarket-app.netlify.app
      </div>
      <div
        style={{
          display: "flex",
          background: C.clay,
          color: "#fff",
          borderRadius: 999,
          padding: "12px 26px",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: BODY_FONT,
        }}
      >
        {hint}
      </div>
    </div>
  );
}

function Chip({
  children,
  bg,
  color,
}: {
  children: string;
  bg: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        background: bg,
        color,
        borderRadius: 14,
        padding: "14px 24px",
        fontSize: 27,
        fontWeight: 700,
        fontFamily: BODY_FONT,
      }}
    >
      {children}
    </div>
  );
}

export async function GET(req: Request) {
  if (!authed(req)) return new Response("unauthorized", { status: 401 });

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "custom";
  const sizeKey = (url.searchParams.get("size") ?? "square") as SizeKey;
  const size = SIZES[sizeKey] ?? SIZES.square;
  const tall = size.height > size.width;
  const fonts = await getCardFonts();

  let headerLabel = "Protein Deals";
  let footerHint = "Link in bio";
  let body: React.ReactNode = null;

  if (kind === "deal") {
    const slug = url.searchParams.get("slug") ?? "";
    const item = await getItemBySlug(slug);
    if (!item) return new Response("unknown item", { status: 404 });

    const cat = CATEGORY_BY_SLUG[item.category];
    headerLabel = cat?.short ?? "Protein Deals";
    footerHint = "Shop it — link in bio";
    const per10g = formatPer10g(item.metrics.costPerGramProteinCents);
    const savings = item.savingsPercent ?? 0;

    body = (
      <div
        style={{
          display: "flex",
          flexDirection: tall ? "column" : "row",
          alignItems: "center",
          gap: 48,
          width: "100%",
          flexGrow: 1,
        }}
      >
        {item.imageUrl ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: C.surface,
              borderRadius: 28,
              border: `2px solid ${C.line}`,
              width: tall ? 460 : 400,
              height: tall ? 460 : 400,
              padding: 30,
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: tall ? "center" : "flex-start",
            gap: 22,
            // explicit width so satori wraps long names instead of clipping:
            // 1080 canvas − 144 padding − (image 400 + gap 48) in row layout
            width: tall || !item.imageUrl ? 936 : 488,
          }}
        >
          {item.brand ? (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 700,
                color: C.muted,
                fontFamily: BODY_FONT,
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              {item.brand}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: item.name.length > 40 ? 46 : 56,
              fontWeight: 600,
              color: C.ink,
              fontFamily: DISPLAY_FONT,
              lineHeight: 1.12,
              textAlign: tall ? "center" : "left",
            }}
          >
            {item.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 18,
              flexWrap: "wrap",
              maxWidth: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 96,
                fontWeight: 700,
                color: C.ink,
                fontFamily: BODY_FONT,
              }}
            >
              {formatPrice(item.effectivePriceCents)}
            </div>
            {savings > 0 ? (
              <div
                style={{
                  display: "flex",
                  background: C.goldSoft,
                  color: C.gold,
                  borderRadius: 999,
                  padding: "10px 22px",
                  fontSize: 30,
                  fontWeight: 700,
                  fontFamily: BODY_FONT,
                }}
              >
                {savings}% off right now
              </div>
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: tall ? "center" : "flex-start",
            }}
          >
            <Chip bg={C.leaf} color="#fff">
              {`${per10g} per 10 g protein`}
            </Chip>
            <Chip bg={C.leafSoft} color={C.leafDeep}>
              {`${item.proteinPerServing_g} g protein per serving`}
            </Chip>
          </div>
        </div>
      </div>
    );
  } else if (kind === "blog") {
    const slug = url.searchParams.get("slug") ?? "";
    const post = await getPostBySlug(slug);
    if (!post) return new Response("unknown post", { status: 404 });

    headerLabel = post.tag ?? "From the Blog";
    footerHint = "Read it — link in bio";
    body = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 34,
          width: "100%",
          flexGrow: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 110,
            height: 10,
            background: C.clay,
            borderRadius: 999,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: post.title.length > 60 ? 58 : 70,
            fontWeight: 600,
            color: C.ink,
            fontFamily: DISPLAY_FONT,
            lineHeight: 1.12,
          }}
        >
          {post.title}
        </div>
        {post.description ? (
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 500,
              color: C.muted,
              fontFamily: BODY_FONT,
              lineHeight: 1.4,
            }}
          >
            {post.description}
          </div>
        ) : null}
        <Chip bg={C.leafSoft} color={C.leafDeep}>
          New on the MacroMarket blog
        </Chip>
      </div>
    );
  } else {
    const headline = url.searchParams.get("headline") ?? "The most protein for your money.";
    const sub = url.searchParams.get("sub") ?? "";
    const badge = url.searchParams.get("badge") ?? "";

    headerLabel = badge || "Protein Value";
    footerHint = "Link in bio";
    body = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 34,
          width: "100%",
          flexGrow: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 110,
            height: 10,
            background: C.leaf,
            borderRadius: 999,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: headline.length > 60 ? 58 : 74,
            fontWeight: 600,
            color: C.ink,
            fontFamily: DISPLAY_FONT,
            lineHeight: 1.12,
          }}
        >
          {headline}
        </div>
        {sub ? (
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 500,
              color: C.muted,
              fontFamily: BODY_FONT,
              lineHeight: 1.4,
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: C.paper,
          padding: 72,
          fontFamily: BODY_FONT,
        }}
      >
        <Header label={headerLabel} />
        {body}
        <Footer hint={footerHint} />
      </div>
    ),
    {
      ...size,
      fonts: fonts.length ? fonts : undefined,
    },
  );
}
