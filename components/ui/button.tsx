import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
const variants=cva('inline-flex items-center justify-center gap-6 rounded-full px-6 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-50',{variants:{variant:{default:'bg-[#20251d] text-[#eeece4] hover:bg-[#ef512b] hover:text-[#20251d]',outline:'border border-current bg-transparent hover:bg-black/5'}},defaultVariants:{variant:'default'}})
export function Button({asChild=false,className,variant,...props}:React.ComponentProps<'button'> & VariantProps<typeof variants> & {asChild?:boolean}){const Comp=asChild?Slot:'button';return <Comp className={cn(variants({variant}),className)} {...props}/>}
