import Link from "next/link";

interface SiteLogoProps {
  size?: "sm" | "md" | "lg";
  link?: boolean;
}

const sizes = {
  sm: { diamond: "w-4 h-4", text: "text-lg" },
  md: { diamond: "w-5 h-5", text: "text-xl" },
  lg: { diamond: "w-6 h-6", text: "text-2xl" },
};

export function SiteLogo({ size = "md", link = true }: SiteLogoProps) {
  const s = sizes[size];

  const content = (
    <span className="flex items-center gap-2">
      <span
        className={`${s.diamond} bg-teal rotate-45 rounded-sm shrink-0`}
        aria-hidden="true"
      />
      <span
        className={`font-heading ${s.text} text-foreground uppercase tracking-wide font-semibold`}
      >
        Black Diamond
      </span>
    </span>
  );

  if (link) {
    return <Link href="/">{content}</Link>;
  }

  return content;
}
