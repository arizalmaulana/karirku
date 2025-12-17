import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 shadow-md hover:shadow-lg",
        outline:
          "border border-gray-200/30 bg-background text-foreground hover:bg-gray-50 hover:border-indigo-300/50 dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost:
          "hover:bg-gray-100 hover:text-gray-900",
        link: "text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-700",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  // If className contains custom bg-* classes, skip default variant to avoid gradient conflict
  const hasCustomBg = className && 
    (typeof className === 'string' && /bg-\w+-\d+/.test(className));
  
  // When variant is undefined and has custom bg, explicitly set to null to skip default
  const finalVariant = hasCustomBg && variant === undefined ? null : variant;

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant: finalVariant as any, size }), 
        className,
        // Force override gradient classes if custom bg is present
        hasCustomBg && "!bg-[unset] !from-[unset] !via-[unset] !to-[unset]"
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
