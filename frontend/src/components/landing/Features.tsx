import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const features = [
  {
    tag: "Intelligence",
    title: "From noise to knowledge",
    description:
      "Turn raw visual data into actionable localization insights. Our AI filters out the noise.",
    image: "/feature-1.png",
  },
  {
    tag: "Platform",
    title: "The single source of truth",
    description:
      "Centralize your localization QA process. One platform for all your visual testing needs.",
    image: "/feature-2.png",
  },
  {
    tag: "Security",
    title: "Infrastructure you can trust",
    description:
      "Enterprise-grade security and reliability for your game assets and data.",
    image: "/feature-3.png",
  },
];

export default function Features() {
  return (
    <section className="py-32 bg-black">
      <div className="container mx-auto px-6">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">
            <span className="text-white">Comprehensive</span>{" "}
            <span className="text-gray-800">localization solutions</span>
          </h2>
        </motion.div>

        {/* Feature Items */}
        <div className="space-y-32">
          {features.map((feature, idx) => {
            const isOdd = idx % 2 === 0;

            return (
              <motion.div
                key={feature.tag}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${
                  isOdd ? "lg:flex-row" : "lg:flex-row-reverse"
                } gap-16 lg:gap-24 items-center`}
              >
                {/* Text Side */}
                <div className="flex-1 space-y-8">
                  {/* Tag */}
                  <span className="text-[10px] font-mono text-primary-500 tracking-[0.4em] uppercase">
                    [{feature.tag}]
                  </span>

                  {/* Title */}
                  <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                    {feature.description}
                  </p>

                  {/* Learn More */}
                  <Link
                    to="/coming-soon"
                    className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-primary-500 tracking-widest uppercase transition-colors group"
                  >
                    Learn more
                    <svg
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>

                {/* Image Side */}
                <div className="flex-1 w-full">
                  <div className="relative aspect-video rounded-sm border border-white/5 bg-black overflow-hidden group">
                    {/* Decorative Corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/10 z-10" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/10 z-10" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/10 z-10" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/10 z-10" />

                    {/* Placeholder Image */}
                    <div className="w-full h-full bg-graphite-800 flex items-center justify-center grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700">
                      <div className="text-center">
                        <svg
                          className="w-16 h-16 mx-auto text-graphite-600 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-xs text-graphite-500 uppercase tracking-wider">
                          Feature Preview
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
