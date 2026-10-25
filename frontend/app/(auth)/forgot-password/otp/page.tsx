"use client"

import { ArrowLeft } from "lucide-react"
import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

function VerifyForgotOtpContent() {
  const [otp, setOtp] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get("email")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  if (!email) {
    setError("E-mail não informado. Reinicie a recuperação de senha.")
    return
  }

  setIsSubmitting(true)
  setError(null)

  setTimeout(() => {
    setIsSubmitting(false)

    router.push(
      `/forgot-password/otp?email=${encodeURIComponent(email)}`
    )
  }, 2000)
}

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/forgot-password"
        aria-label="Voltar"
        className="mb-4 inline-flex items-center gap-2 text-foreground"
      >
        <ArrowLeft className="size-5" />
      </Link>

      <h2 className="text-2xl font-bold">
        Verifique o código
      </h2>

      <p className="mt-1.5 text-sm text-muted-foreground">
        {email ? (
          <>
            Digite o código de 6 dígitos enviado para{" "}
            <span className="font-medium text-foreground">
              {email}
            </span>
          </>
        ) : (
          "Digite o código de 6 dígitos enviado para seu e-mail."
        )}
      </p>

      <form
        className="mt-6"
        onSubmit={handleSubmit}
      >
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          disabled={isSubmitting}
        >
          <InputOTPGroup className="w-full">
            <InputOTPSlot index={0} className="w-full h-14 text-lg"/>
            <InputOTPSlot index={1} className="w-full h-14 text-lg"/>
            <InputOTPSlot index={2} className="w-full h-14 text-lg"/>
            <InputOTPSlot index={3} className="w-full h-14 text-lg"/>
            <InputOTPSlot index={4} className="w-full h-14 text-lg"/>
            <InputOTPSlot index={5} className="w-full h-14 text-lg"/>
          </InputOTPGroup>
        </InputOTP>

        {error && (
          <p className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="mt-6 h-11 w-full"
          disabled={isSubmitting || otp.length !== 6}
        >
          {isSubmitting ? (
            <>
              <Spinner className="size-4" />
              Verificando...
            </>
          ) : (
            "Verificar código"
          )}
        </Button>
      </form>
    </div>
  )
}

export default function VerifyForgotOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForgotOtpContent />
    </Suspense>
  )
}
