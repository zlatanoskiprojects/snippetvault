import { motion, useReducedMotion } from 'framer-motion'

export default function LandingStory() {
  const shouldReduceMotion = useReducedMotion()

  function revealProps(delay: number) {
    return shouldReduceMotion ? {} : {
      initial: { opacity: 0, y: 16 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, amount: 0.2 },
      transition: { duration: 0.5, ease: 'easeOut' as const, delay },
    }
  }

  return (
    <section className="w-full border-y border-border-default bg-sidebar px-6 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[1048px]">
        <motion.p
          {...revealProps(0)}
          className="text-xs font-medium uppercase tracking-[0.18em] text-accent"
        >
          The story behind the vault
        </motion.p>
        <motion.h2
          {...revealProps(0.08)}
          className="mt-4 text-3xl font-bold leading-tight text-primary sm:text-4xl lg:text-5xl"
        >
          Why SnippetVault exists
        </motion.h2>

        <div className="mt-8 max-w-4xl space-y-5 text-sm leading-7 text-secondary sm:text-base sm:leading-8">
          <motion.p {...revealProps(0.16)}>
            I&apos;m <span className="text-primary">David</span>, and I built SnippetVault because I was tired of finding myself searching for code I knew I&apos;d already written before. A useful function buried in an old project, a configuration I had to recreate, or a snippet I remembered using but couldn&apos;t remember <span className="text-primary">where I saved it</span>.
          </motion.p>
          <motion.p {...revealProps(0.24)}>
            The problem wasn&apos;t writing the code again — it was wasting time <span className="text-primary">finding and organizing the code I already had</span>. That&apos;s why I created SnippetVault: one place to save your reusable code, organize it with projects and tags, search through it instantly, and come back to it whenever you need it.
          </motion.p>
          <motion.p {...revealProps(0.32)}>
            I believe useful code shouldn&apos;t disappear the moment a project is finished. <span className="text-primary">Write it once, keep it organized, and reuse it when it matters.</span> SnippetVault is built to make your personal code library simple, fast, and actually useful — so you can spend less time searching through old projects and more time <span className="text-primary">building new ones</span>.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
