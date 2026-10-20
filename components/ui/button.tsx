import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Caldera Button System:
 * - Primary CTA: Filled Ember (#fc5000) with Obsidian (#070607) text, 800px full pill radius, DM Sans 500. No shadow.
 * - Secondary: Transparent background, 1.5px Obsidian border, 800px pill radius.
 * - Ghost: Transparent with Obsidian text.
 * - Sulfur: Sulfur yellow (#f5f28e) with Obsidian text.
 */
const variants = cva(
  'inline-flex items-center justify-center gap-3 rounded-[800px] text-[16px] font-medium leading-[1.2] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none no-underline border-0',
  {
    variants: {
      variant: {
        default:
          'bg-[#fc5000] text-[#070607] hover:bg-[#e04800] py-3 px-6 font-medium shadow-none',
        secondary:
          'bg-transparent text-[#070607] border-[1.5px] border-[#070607] hover:bg-[#070607]/5 py-3 px-6 font-medium shadow-none',
        ghost:
          'bg-transparent text-[#070607] hover:text-[#fc5000] py-2 px-3 font-medium shadow-none',
        sulfur:
          'bg-[#f5f28e] text-[#070607] hover:bg-[#ece97e] py-2 px-4 text-[13px] font-medium shadow-none',
        dark:
          'btn-dark bg-[#070607] text-white hover:bg-[#202020] py-3 px-6 font-medium shadow-none',
      },
      size: {
        default: 'py-3 px-6',
        sm: 'py-2 px-4 text-[14px]',
        lg: 'py-4 px-8 text-[18px]',
        pill: 'py-2 px-5 text-[14px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export function Button({
  asChild = false,
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof variants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(variants({ variant, size }), className)} {...props} />
}
