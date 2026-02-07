import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function ComingSoonPage() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-graphite-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-hexagon opacity-20" />
      
      {/* Content */}
      <div className="relative text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-graphite-800 border border-graphite-700 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Coming Soon
          </h1>
          
          {/* Description */}
          <p className="text-lg text-graphite-400 mb-8 max-w-md mx-auto">
            We're working hard to bring you something amazing. Stay tuned for updates!
          </p>

          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-graphite-800 hover:bg-graphite-700 text-white font-medium rounded-lg transition-colors border border-graphite-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
