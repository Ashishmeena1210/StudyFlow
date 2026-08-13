import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { loginApi } from "../api/authApi";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { token } = await loginApi(trimmedEmail, password);
      localStorage.setItem("studyflow-token", token);

      // Go directly to dashboard.
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Unable to log in. Please try again.");
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
            right-[-100px]
            h-[400px]
            w-[400px]
            rounded-full
            bg-violet-500/5
            blur-3xl
          "
        />
      </div>

      {/* Login */}

      <div className="relative z-10 w-full max-w-sm">

        {/* Header */}

        <div className="mb-8 text-center">

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
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-[#64748B]">
            Log in to continue your study journey.
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

          {/* Email */}

          <div className="space-y-2">

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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your password"
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

          {/* Login button */}

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

                Logging in...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Log in
              </>
            )}
          </button>

        </form>

        {/* Register */}

        <p className="mt-6 text-center text-sm text-[#64748B]">
          Don't have an account?{" "}

          <Link
            to="/register"
            className="font-medium text-cyan-400 hover:text-cyan-300"
          >
            Create one
          </Link>
        </p>

        <p className="mt-8 text-center text-[11px] text-[#334155]">
          StudyFlow · Focus better. Study smarter.
        </p>

      </div>
    </main>
  );
}