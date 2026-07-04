import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal `asChild` Slot — merges className/props onto a single child element.
 * Avoids pulling in @radix-ui/react-slot for our simple button/link needs.
 */
export const Slot = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }
>(function Slot({ children, className, ...props }, ref) {
  if (!React.isValidElement(children)) return null;
  const child = children as React.ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  return React.cloneElement(child, {
    ...props,
    ...childProps,
    className: cn(className, childProps.className as string | undefined),
    ref,
  } as Record<string, unknown>);
});
