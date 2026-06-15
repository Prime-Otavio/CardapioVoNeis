import { motion } from 'framer-motion'

export default function Header() {
  return (
    <header className="relative overflow-hidden bg-accentLight">
      {/* Enfeites suaves de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-12 h-56 w-56 rounded-full bg-accent/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-6 top-8 select-none text-xl text-accent/25"
      >
        ✿
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-16 select-none text-lg text-accent/25"
      >
        ✦
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-10 select-none text-lg text-accent/20"
      >
        ✦
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 right-12 select-none text-xl text-accent/25"
      >
        ✿
      </div>

      <div className="relative mx-auto max-w-5xl px-5 py-10 text-center sm:py-14 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <img
            src="/logo.png"
            alt="Vó Neis Confeitaria"
            className="h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56 lg:drop-shadow-[0_14px_30px_rgba(217,106,133,0.25)]"
          />

          <div className="mt-3 flex w-full max-w-xs items-center gap-3 lg:max-w-sm">
            <span className="ornament-line" aria-hidden="true" />
            <span className="select-none text-sm text-accent/60">♥</span>
            <span className="ornament-line" aria-hidden="true" />
          </div>

          <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-ink/60 lg:max-w-lg lg:text-base">
            Bolos e doces feitos à mão, com carinho de vó.
            <br />
            Escolha suas delícias e peça pelo WhatsApp.
          </p>

          <span className="mt-4 hidden select-none items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 font-sans text-xs font-medium tracking-wide text-ink/55 shadow-card backdrop-blur lg:inline-flex">
            ✦ Feito fresquinho todos os dias ✦
          </span>
        </motion.div>
      </div>

      {/* Borda ondulada inferior */}
      <svg
        aria-hidden="true"
        className="block w-full text-background"
        viewBox="0 0 1440 28"
        preserveAspectRatio="none"
        style={{ height: 18 }}
      >
        <path
          fill="currentColor"
          d="M0,28 C120,4 240,4 360,16 C480,28 600,28 720,16 C840,4 960,4 1080,16 C1200,28 1320,28 1440,16 L1440,28 L0,28 Z"
        />
      </svg>
    </header>
  )
}
