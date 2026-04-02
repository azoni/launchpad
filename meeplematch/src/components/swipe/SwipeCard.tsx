"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";

export interface SwipeCardProduct {
  asin: string;
  title: string;
  images: string[];
  rating: number | null;
  reviewCount: number | null;
  savingsPercent: number | null;
  savingsDisplay: string | null;
  isOnSale: boolean;
  playerCountMin: number;
  playerCountMax: number;
  playTimeMin: number;
  playTimeMax: number;
  complexity: number;
  cooperative: boolean;
  themes: string[];
  featureBullets: string[];
  matchReason?: string;
}

interface SwipeCardProps {
  product: SwipeCardProduct;
  isTop: boolean;
  onSwipe: (direction: "left" | "right" | "up") => void;
  onViewDetails: () => void;
}

function complexityLabel(c: number): string {
  if (c <= 1.5) return "Chill";
  if (c <= 2.5) return "Light";
  if (c <= 3.5) return "Medium";
  if (c <= 4.5) return "Crunchy";
  return "Brain Melter";
}

export function SwipeCard({
  product,
  isTop,
  onSwipe,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const playerRange =
    product.playerCountMin === product.playerCountMax
      ? `${product.playerCountMin} player`
      : `${product.playerCountMin}-${product.playerCountMax} players`;

  const timeRange =
    product.playTimeMin === product.playTimeMax
      ? `${product.playTimeMin} min`
      : `${product.playTimeMin}-${product.playTimeMax} min`;

  function handleDragEnd(
    _: unknown,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
  ) {
    const threshold = 100;
    const velocityThreshold = 500;

    if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
      onSwipe("up");
    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      onSwipe("right");
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      onSwipe("left");
    }
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing p-2"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale: isTop ? 1 : 0.95,
        opacity: isTop ? 1 : 0.7,
        zIndex: isTop ? 10 : 5,
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="card-cardboard overflow-hidden h-full flex flex-col relative">
        {/* Like/Nope stamp overlays */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-4 left-4 z-20 font-heading text-3xl text-candy-green rotate-[-15deg] border-4 border-candy-green bg-white/90 px-3 py-0.5 rounded-xl"
              style={{ opacity: likeOpacity }}
            >
              YES!
            </motion.div>
            <motion.div
              className="absolute top-4 right-4 z-20 font-heading text-3xl text-destructive rotate-[15deg] border-4 border-destructive bg-white/90 px-3 py-0.5 rounded-xl"
              style={{ opacity: nopeOpacity }}
            >
              NAH
            </motion.div>
          </>
        )}

        {/* Image — constrained height */}
        <div className="relative w-full h-[45%] min-h-[140px] bg-white shrink-0">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={`${product.title} board game box`}
              fill
              className="object-contain p-3"
              sizes="(max-width: 768px) 90vw, 400px"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground font-bold">
              No image
            </div>
          )}

          {/* Sale badge */}
          {product.isOnSale && product.savingsDisplay && (
            <div className="absolute top-2 right-2 bg-destructive text-white px-2 py-0.5 rounded-full text-xs font-bold rotate-[-3deg] border-2 border-white shadow-md">
              {product.savingsDisplay}
            </div>
          )}
        </div>

        {/* Info — always visible */}
        <div className="p-4 flex-1 flex flex-col gap-2 overflow-hidden">
          {/* Title */}
          <h3 className="font-heading text-lg sm:text-xl leading-tight line-clamp-2">
            {product.title}
          </h3>

          {/* Rating */}
          {product.rating != null && product.reviewCount != null && (
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <span className="text-candy-orange">
                {"★".repeat(Math.floor(product.rating))}
                {"☆".repeat(5 - Math.floor(product.rating))}
              </span>
              <span className="text-muted-foreground text-xs">
                {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString()})
              </span>
            </div>
          )}

          {/* Quick facts row */}
          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
            <span>{playerRange}</span>
            <span className="text-border">|</span>
            <span>{timeRange}</span>
            <span className="text-border">|</span>
            <span>{complexityLabel(product.complexity)}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {product.cooperative && (
              <span className="bg-candy-blue text-white px-2 py-0.5 rounded-full text-[11px] font-bold">
                Co-op
              </span>
            )}
            {product.themes.slice(0, 3).map((theme) => (
              <span
                key={theme}
                className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-[11px] font-bold"
              >
                {theme}
              </span>
            ))}
          </div>

          {/* Feature bullet preview */}
          {product.featureBullets.length > 0 && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {product.featureBullets[0]}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
