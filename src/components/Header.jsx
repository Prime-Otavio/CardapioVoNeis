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
        className="pointer-events-none absolute right-8 top-16 select-none text-lg text-a