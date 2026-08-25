import Image from "next/image";

export function LandingFeatures() {
  const features = [
    {
      num: "/01",
      title: "Proven Performance",
      desc: "Manage tasks, boards, and team progress seamlessly on your project pages.",
      lightImage: "/images/landing/project-light.png",
      darkImage: "/images/landing/project-dark.png",
    },
    {
      num: "/02",
      title: "Innovative Design",
      desc: "Stay on top of deadlines and milestones with our integrated calendar view.",
      lightImage: "/images/landing/calendar-light.png",
      darkImage: "/images/landing/calendar-dark.png",
    },
    {
      num: "/03",
      title: "Robust Security",
      desc: "Industry-leading security and customizable preferences in your settings.",
      lightImage: "/images/landing/settings-light.png",
      darkImage: "/images/landing/settings-dark.png",
    },
  ];

  return (
    <section
      id="features"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 border-t border-border/60 animate-fade-up"
    >
      <div className="text-center space-y-2 max-w-xl mx-auto mb-8 sm:mb-10">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
          Why us
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Experience the Difference
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Discover the benefits that make our platform the first choice for
          teams striving for excellence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {features.map((item, idx) => (
          <div
            key={idx}
            className="bg-card p-5 sm:p-6 rounded-3xl border border-border shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-300"
          >
            <div className="w-full aspect-16/10 relative rounded-2xl bg-muted/50 overflow-hidden border border-border/40 flex items-center justify-center">
              {/* Light Mode Image (Hidden in dark mode) */}
              <Image
                src={item.lightImage}
                alt={`${item.title} light preview`}
                fill
                className="object-cover object-top opacity-90 dark:hidden"
              />
              {/* Dark Mode Image (Hidden in light mode) */}
              <Image
                src={item.darkImage}
                alt={`${item.title} dark preview`}
                fill
                className="object-cover object-top opacity-90 hidden dark:block"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                {item.num}
              </span>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
