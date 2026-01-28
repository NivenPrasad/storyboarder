import { Link } from 'react-router-dom';
import {
  FileVideo,
  Layout,
  Users,
  Download,
  Clock,
  CheckSquare,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: Layout,
    title: 'Visual Scene Planning',
    description: 'Drag and drop scenes, add reference images, and visualize your entire video structure.',
  },
  {
    icon: Clock,
    title: 'Timeline & Duration',
    description: 'Track total runtime, set targets, and see a breakdown by scene type.',
  },
  {
    icon: CheckSquare,
    title: 'Production Checklists',
    description: 'Never forget props, equipment, or talent with built-in checklists per scene.',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'Share storyboards with your team, leave comments, and work together.',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    description: 'Export to PDF, CSV, or formats compatible with Notion and Google Docs.',
  },
  {
    icon: FileVideo,
    title: 'Templates',
    description: 'Start fast with templates for tutorials, vlogs, reviews, interviews, and more.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileVideo className="w-8 h-8 text-primary-600" />
            <span className="font-bold text-xl">Storyboard Creator</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn btn-primary"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          Plan Your YouTube Videos
          <br />
          Like a Pro
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Transform your video ideas into actionable shooting plans. Create visual storyboards,
          organize scenes, and collaborate with your team.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="btn btn-primary text-lg px-8 py-3 flex items-center gap-2"
          >
            Start Creating
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="btn btn-secondary text-lg px-8 py-3"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Preview */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-green-500' : i === 2 ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                    <span className="font-medium">Scene {i}</span>
                    <span className="ml-auto text-sm text-gray-500">{15 + i * 5}s</span>
                  </div>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need to Plan Better Videos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Level Up Your Content?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Join creators who are already using Storyboard Creator to plan better videos.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-primary-600" />
            <span className="font-semibold">Storyboard Creator</span>
          </div>
          <p className="text-sm text-gray-500">
            Built for YouTube creators by Extra Masala Studios
          </p>
        </div>
      </footer>
    </div>
  );
}
