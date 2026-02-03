import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Strength Training Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional periodization training system with macrocycles, mesocycles,
            and microcycles. Track your progress and achieve your goals.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Periodization</h3>
            <p className="text-gray-600">
              Structured training with macrocycles, mesocycles, and microcycles for optimal progression
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">💪</div>
            <h3 className="text-xl font-semibold mb-2">Track Workouts</h3>
            <p className="text-gray-600">
              Log sets, reps, weight, and RPE for every exercise in real-time
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">Monitor Progress</h3>
            <p className="text-gray-600">
              Visualize your strength gains and volume progression over time
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
