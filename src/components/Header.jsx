import { motion } from 'framer-motion'

export default function Header() {
  return (
    <header className="relative overflow-hidden bg-accentLight">
      <div className="mx-auto max-w-5xl px-5 py-10 text-center sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <img
            src="/logo.svg"
            alt="Vó Neis Confeitaria"
            className="mx-auto h-40 w-40 sm:h-48 sm:w-48"
          />
          <p className="mx-auto mt-4 max-w-md font-sans text-sm text-ink/60">
            Bolos e doces feitos à mão, com carinho de vó. Escolha suas delícias e peça pelo WhatsApp.
          </p>
        </motion.div>
      </div>
    </header>
  )
}
