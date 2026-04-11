import { classNames } from "../../lib/format";

const FIELD =
  "w-full rounded-sm border border-[color:var(--color-rule)] bg-[#fffaf0] px-3 py-1.5 text-sm placeholder:text-[color:var(--color-ink-faint)] focus:border-[color:var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-ink)]";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={classNames(FIELD, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={classNames(FIELD, props.className)} />;
}

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]"
    >
      {children}
    </label>
  );
}
