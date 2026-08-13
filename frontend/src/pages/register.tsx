import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { registerApi } from "../api/authApi";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      const { token } = await registerApi(trimmedEmail, password, name.trim());
      localStorage.setItem("studyflow-token", token);

      // Go directly to dashboard after registration.
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 flex h-screen w-screen items-center justify-center overflow-hidden bg-[#020617] px-4">

      {/* Background */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div
          className="
            absolute
            left-1/2
            top-[-180px]
            h-[420px]
            w-[420px]
            -translate-x-1/2
            rounded-full
            bg-cyan-400/5
            blur-3xl
          "
        />

        <div
          className="
            absolute
            bottom-[-200px]
            left-[-100px]
            h-[400px]
            w-[400px]
            rounded-full
            bg-violet-500/5
            blur-3xl
          "
        />

      </div>

      {/* Register */}

      <div className="relative z-10 w-full max-w-sm">

        {/* Header */}

        <div className="mb-7 text-center">

          <div
            className="
              mx-auto
              mb-4
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-cyan-400/30
              bg-cyan-400/10
            "
          >
            <span
              className="
                h-2.5
                w-2.5
                rounded-full
                bg-cyan-400
                shadow-[0_0_12px_rgba(34,211,238,0.7)]
              "
            />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#E5E7EB]">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-[#64748B]">
            Start tracking your study journey.
          </p>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="
            rounded-xl
            border
            border-[#1F2937]
            bg-[#0F172A]
            p-6
            shadow-2xl
          "
        >

          {/* Error */}

          {error && (
            <div
              role="alert"
              className="
                mb-4
                rounded-lg
                border
                border-red-400/20
                bg-red-400/10
                px-3
                py-2.5
                text-sm
                text-red-400
              "
            >
              {error}
            </div>
          )}

          {/* Name */}

          <div className="space-y-2">

            <label
              htmlFor="name"
              className="block text-sm font-medium text-[#CBD5E1]"
            >
              Full name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Your name"
              disabled={loading}
              className="
                w-full
                rounded-lg
                border
                border-[#1F2937]
                bg-[#020617]
                px-3
                py-2.5
                text-sm
                text-[#E5E7EB]
                outline-none
                placeholder:text-[#475569]
                transition
                focus:border-cyan-400
                focus:ring-1
                focus:ring-cyan-400
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />

          </div>

          {/* Email */}

          <div className="mt-4 space-y-2">

            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#CBD5E1]"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="you@example.com"
              disabled={loading}
              className="
                w-full
                rounded-lg
                border
                border-[#1F2937]
                bg-[#020617]
                px-3
                py-2.5
                text-sm
                text-[#E5E7EB]
                outline-none
                placeholder:text-[#475569]
                transition
                focus:border-cyan-400
                focus:ring-1
                focus:ring-cyan-400
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />

          </div>

          {/* Password */}

          <div className="mt-4 space-y-2">

            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#CBD5E1]"
            >
              Password
            </label>

            <div className="relative">

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Create a password"
                disabled={loading}
                className="
                  w-full
                  rounded-lg
                  border
                  border-[#1F2937]
                  bg-[#020617]
                  px-3
                  py-2.5
                  pr-11
                  text-sm
                  text-[#E5E7EB]
                  outline-none
                  placeholder:text-[#475569]
                  transition
                  focus:border-cyan-400
                  focus:ring-1
                  focus:ring-cyan-400
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-[#64748B]
                  hover:text-[#E5E7EB]
                "
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>

            </div>

          </div>

          {/* Confirm Password */}

          <div className="mt-4 space-y-2">

            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[#CBD5E1]"
            >
              Confirm password
            </label>

            <div className="relative">

              <input
                id="confirmPassword"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Confirm your password"
                disabled={loading}
                className="
                  w-full
                  rounded-lg
                  border
                  border-[#1F2937]
                  bg-[#020617]
                  px-3
                  py-2.5
                  pr-11
                  text-sm
                  text-[#E5E7EB]
                  outline-none
                  placeholder:text-[#475569]
                  transition
                  focus:border-cyan-400
                  focus:ring-1
                  focus:ring-cyan-400
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) => !previous
                  )
                }
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-[#64748B]
                  hover:text-[#E5E7EB]
                "
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>

            </div>

          </div>

          {/* Create Account */}

          <button
            type="submit"
            disabled={loading}
            className="
              mt-6
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-[#06B6D4]
              px-4
              py-2.5
              text-sm
              font-semibold
              text-[#020617]
              transition
              hover:bg-[#22D3EE]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? (
              <>
                <span
                  className="
                    h-4
                    w-4
                    animate-spin
                    rounded-full
                    border-2
                    border-[#020617]/30
                    border-t-[#020617]
                  "
                />

                Creating account...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Create account
              </>
            )}
          </button>

        </form>

        {/* Login */}

        <p className="mt-6 text-center text-sm text-[#64748B]">
          Already have an account?{" "}

          <Link
            to="/login"
            className="font-medium text-cyan-400 hover:text-cyan-300"
          >
            Log in
          </Link>
        </p>

        <p className="mt-8 text-center text-[11px] text-[#334155]">
          StudyFlow · Focus better. Study smarter.
        </p>

      </div>
    </main>
  );
}