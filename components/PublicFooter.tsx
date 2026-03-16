import Link from 'next/link'
import { PBeXLogo } from '@/components/PBeXLogo'

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 px-4">
      <div className="container mx-auto max-w-5xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <PBeXLogo className="h-7 w-auto" color="#FF8000" />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/login" className="hover:text-white transition">Log in</Link>
            <Link href="/register" className="hover:text-white transition">Register</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <a href="mailto:pbx.strengthtraining@gmail.com" className="hover:text-white transition">
              Contact Us
            </a>
          </div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} pbX. All rights reserved.</p>
        </div>
        <p className="text-center text-xs text-gray-600">ABN 57 659 096 250</p>
      </div>
    </footer>
  )
}
