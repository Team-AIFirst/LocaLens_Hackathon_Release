import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Features from "../components/landing/Features";
import CompareSlider from "../components/CompareSlider";

export default function FeaturesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 bg-graphite-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hexagon opacity-30" />
        
        {/* Content */}
        <div className="relative container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="text-white">Powerful features for</span>
              <br />
              <span className="text-graphite-400">localization teams</span>
            </h1>
            <p className="text-xl text-graphite-400 leading-relaxed max-w-2xl mx-auto">
              Discover how LocaLens helps game studios ship perfectly localized games faster than ever.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <Features />

      {/* Compare Section */}
      <section className="py-24 bg-graphite-900">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              See the difference
            </h2>
            <p className="text-lg text-graphite-400 max-w-xl mx-auto">
              Traditional QA vs AI-powered analysis. Drag the slider to compare.
            </p>
          </motion.div>
          
          <CompareSlider />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-graphite-950">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to get started?
            </h2>
            <p className="text-lg text-graphite-400 mb-8 max-w-2xl mx-auto">
              Start analyzing your game's localization quality today. No credit card required.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-400 text-graphite-900 font-semibold text-lg rounded-lg transition-colors shadow-glow-yellow"
            >
              Try LocaLens Free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
