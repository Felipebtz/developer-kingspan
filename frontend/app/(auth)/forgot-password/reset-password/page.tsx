"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import PasswordInput from "@/components/ui/PasswordInpunt"
import { CheckCircle2, Link } from "lucide-react"

function ResetPasswordContent() {
  const searchParams = useSearchParams()

  const email = searchParams.get("email")
  const resetToken = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const misMatch =
    confirmPassword.length > 0 &&
    password !== confirmPassword

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    setError(null)

    if (misMatch) {
      return
    }

    if (!resetToken) {
      setError("Token de recuperação inválido.")
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      setPassword("")
      setConfirmPassword("")
      setIsSubmitting(false)
      setIsDone(true)
    }, 2000)
  }
    if (isDone){
        return(
            <div className="w-full max-w-sm flex flex-col justify-center items-center">
                <div className="flex size-16 items-center justify-center roundend-full bg-accent">
                    <CheckCircle2 className="size-6 text-primary" />
                </div>
                <h2 className="nt-4 text=2xl font-bold">
                    Senha alterada
                </h2>
                <p className="mt-2 text-sm text-muted-foreground text-center">
                    Sua senha foi alterada. Você pode fazer login com sua nova senha.
                </p>
                <Button className="mt-6 h-11 w-full">
                    <Link
                    href="/login"
                    >

                        Voltar para o login
                    </Link>
                </Button>
            </div>
        )
        }
  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-bold">
        Defina sua nova senha
      </h2>

      <p className="mt-1.5 text-sm text-muted-foreground">
        {email ? (
          <>
            Nova senha para{" "}
            <span className="font-medium text-foreground">
              {email}
            </span>
          </>
        ) : (
          "Escolha uma nova senha para sua conta."
        )}
      </p>

      <form
        className="mt-7"
        onSubmit={handleSubmit}
      >
        <FieldGroup>

          <Field>
            <FieldLabel htmlFor="password">
              Senha
            </FieldLabel>

            <PasswordInput
              id="password"
              className="h-11"
              placeholder="Digite sua nova senha"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">
              Confirme a senha
            </FieldLabel>

            <PasswordInput
              id="confirm-password"
              className="h-11"
              placeholder="Confirme sua nova senha"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              disabled={isSubmitting}
            />

            {misMatch && (
              <FieldError>
                As senhas não coincidem.
              </FieldError>
            )}
          </Field>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="mt-6 h-11 w-full"
            disabled={
              isSubmitting ||
              misMatch ||
              !password ||
              !confirmPassword
            }
          >
            {isSubmitting ? (
              <>
                <Spinner className="size-4" />
                Alterando senha...
              </>
            ) : (
              "Alterar senha"
            )}
          </Button>

        </FieldGroup>
      </form>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}
