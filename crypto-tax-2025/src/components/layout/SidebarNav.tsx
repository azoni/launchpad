import { NavLink } from "react-router-dom";
import { classNames } from "../../lib/format";

const LINKS = [
  { to: "/", label: "Overview", end: true },
  { to: "/wallets", label: "Wallets & Imports" },
  { to: "/review", label: "Review Queue" },
  { to: "/transactions", label: "Transactions" },
  { to: "/summary", label: "Tax Summary" },
  { to: "/exports", label: "Exports" },
];

export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            classNames(
              "rounded-sm px-3 py-2 text-sm font-medium tracking-wide transition",
              isActive
                ? "bg-[color:var(--color-ink)] text-[color:var(--color-paper)]"
                : "text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-deep)]"
            )
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
