import Image from "next/image";

const features = [
  { icon: "🏔️", title: "Turforslag", desc: "Finn perfekte turer basert på vær og nivå" },
  { icon: "🌤️", title: "Vær", desc: "Sanntidsvær fra Yr for hele ruta" },
  { icon: "🗺️", title: "Kart", desc: "Topografiske kart med ruter og hytter" },
  { icon: "👥", title: "Venner", desc: "Inviter med et klikk, planlegg sammen" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-stone-900 text-white">
      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 pt-20 pb-12 overflow-hidden">
        {/* Mountain photo */}
        <div className="relative w-full max-w-2xl h-72 rounded-3xl overflow-hidden shadow-2xl mb-10 border border-emerald-700/40">
          <Image
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80"
            alt="Norske fjell"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 to-transparent" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 text-4xl select-none">
            <span>🎒</span><span>⛺</span><span>🧭</span>
          </div>
        </div>

        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Friluftskameratene
        </h1>
        <p className="text-xl text-emerald-200 max-w-md mb-8">
          Plan din neste tur i naturen – med vær, kart og venner samlet på ett sted.
        </p>

        <a
          href="/tur"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors shadow-lg"
        >
          🥾 Start planleggingen
        </a>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-6 pb-24 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-emerald-900/50 border border-emerald-700/40 rounded-2xl p-5 flex flex-col gap-2 hover:bg-emerald-800/50 transition-colors"
          >
            <span className="text-3xl">{f.icon}</span>
            <h2 className="font-semibold text-white">{f.title}</h2>
            <p className="text-sm text-emerald-300">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="text-center pb-8 text-emerald-600 text-sm">
        Laget med ❤️ under Blank Hackathon 2026
      </footer>
    </main>
  );
}
