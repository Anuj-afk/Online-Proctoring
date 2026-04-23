function SectionHeading({ eyebrow, title, invert = false }) {
  const eyebrowClasses = invert
    ? 'border-white/10 bg-white/5 text-amber-200'
    : 'border-slate-900/10 bg-[#eae0ce]/80 text-amber-800'

  const titleClasses = invert ? 'text-[#fff8ea]' : 'text-slate-900'

  return (
    <div className="max-w-3xl">
      <p
        className={`mb-4 inline-block rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] ${eyebrowClasses}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`text-4xl leading-[0.98] tracking-[-0.05em] md:text-5xl lg:text-6xl ${titleClasses}`}
      >
        {title}
      </h2>
    </div>
  )
}

export default SectionHeading
