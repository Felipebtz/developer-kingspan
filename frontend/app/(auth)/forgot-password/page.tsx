"use client"

import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

 const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

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
        href="/login"
        aria-label="Voltar ao login"
        className="mb-4 inline-flex items-center gap-2 text-foreground"
      >
        <ArrowLeft className="size-5"  />
      </Link>

      <h2 className="text-2xl font-bold">
        Esqueceu a senha?
      </h2>

      <p className="mt-1.5 text-sm text-muted-foreground">
        Informe seu e-mail para receber um código de 6 dígitos.
      </p>

      <form className="mt-6" onSubmit={handleSubmit}>
        <Field>
          <FieldLabel htmlFor="email">
            E-mail
          </FieldLabel>

          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            className="h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </Field>

        {error && (
          <p className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="mt-6 h-11 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner className="size-4" />
              Enviando código...
            </>
          ) : (
            "Enviar código"
          )}
        </Button>
      </form>
    </div>
  )
}