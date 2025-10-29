import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen py-12">
          <Image 
            src="/logo.svg" 
            alt="Expense Tracker Logo" 
            width={120} 
            height={120}
            className="h-28 w-28 sm:h-32 sm:w-32 mb-8"
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 text-center mb-4">
            Expense Tracker
          </h1>
          <p className="text-xl text-gray-600 text-center mb-8 max-w-2xl">
            Take control of your finances. Track expenses, manage incomes, and monitor your budget effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/signin"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center"
            >
              Get Started
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-medium text-center"
            >
              Go to Dashboard
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            <div className="text-center p-6">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Expenses</h3>
              <p className="text-gray-600">Monitor your spending across different categories with real-time balance updates.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Income</h3>
              <p className="text-gray-600">Record and categorize your income sources for better financial planning.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Reports</h3>
              <p className="text-gray-600">View detailed monthly balances and track your financial progress.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
