export default function ShowcaseFallback() {
  return (
    <div className="flex flex-col items-center gap-8 py-16 px-6">
      <figure className="w-full max-w-4xl">
        <img
          src="/images/cinematic/cinematic-a.webp"
          alt="Traditional trade: a congested port at dusk with stacked shipping containers and paper documents"
          width={2048}
          height={1152}
          loading="lazy"
          className="w-full h-auto rounded"
        />
        <figcaption className="mt-2 text-sm text-muted">Traditional trade</figcaption>
      </figure>

      <figure className="w-full max-w-4xl">
        <img
          src="/images/cinematic/cinematic-b.webp"
          alt="Redefined network trade: a luminous, organized supply chain of glowing nodes"
          width={2048}
          height={1152}
          loading="lazy"
          className="w-full h-auto rounded"
        />
        <figcaption className="mt-2 text-sm text-muted">Networked trade</figcaption>
      </figure>

      <p className="text-center text-4xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight">
        Global trade, <span className="font-semibold">redefined.</span>
      </p>
    </div>
  );
}
