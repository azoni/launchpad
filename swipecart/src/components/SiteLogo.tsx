import Link from "next/link";
import Image from "next/image";

interface SiteLogoProps {
  size?: "sm" | "md" | "lg";
  link?: boolean;
}

const sizes = {
  sm: { icon: 20, text: "text-xl" },
  md: { icon: 24, text: "text-2xl" },
  lg: { icon: 28, text: "text-3xl" },
};

export function SiteLogo({ size = "md", link = true }: SiteLogoProps) {
  const s = sizes[size];

  const content = (
    <span className="flex items-center gap-2">
      <Image src="/icon.svg" alt="" width={s.icon} height={s.icon} className="shrink-0" />
      <span className={`font-heading ${s.text} text-primary tracking-wide`}>
        SwipeCart
      </span>
    </span>
  );

  if (link) {
    return <Link href="/">{content}</Link>;
  }

  return content;
}
