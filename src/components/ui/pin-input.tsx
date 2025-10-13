
"use client"

import * as React from "react"
import { OTPInput, OTPInputContext, OTPInputProps } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const PinInput = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
PinInput.displayName = "PinInput"

const PinInputGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
PinInputGroup.displayName = "PinInputGroup"

const PinInputSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
PinInputSlot.displayName = "PinInputSlot"

const PinInputSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
PinInputSeparator.displayName = "PinInputSeparator"

const PinInputField = React.forwardRef<
    React.ElementRef<"input">,
    React.ComponentPropsWithoutRef<"input">
>(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={cn(
                "w-full h-full text-center bg-transparent border-0 ring-0 focus-visible:ring-0 text-lg font-bold",
                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                className
            )}
            {...props}
        />
    )
})
PinInputField.displayName = "PinInputField"


export { PinInput, PinInputGroup, PinInputSlot, PinInputSeparator, PinInputField }
