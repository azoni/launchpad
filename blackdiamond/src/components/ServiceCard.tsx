import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
}

export function ServiceCard({
  title,
  description,
  icon: Icon,
  href,
}: ServiceCardProps) {
  const card = (
    <div className="card-service p-6">
      <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-teal" />
      </div>
      <h3 className="font-heading text-xl uppercase tracking-wide mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }

  return card;
}
