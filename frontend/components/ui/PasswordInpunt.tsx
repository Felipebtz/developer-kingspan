"use client"

import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "./input"
import { cn } from "@/lib/utils"

const PasswordInput = ({
  className,
  ...props
}: React.ComponentProps<typeof Input>) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
      />

      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {visible ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  )
}

export default PasswordInput