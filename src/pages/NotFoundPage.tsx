import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle px-4">
      <div className="text-center space-y-4 animate-fade-in">
        <p className="text-7xl font-black text-fg tracking-tight">404</p>
        <h1 className="text-xl font-bold text-fg">Halaman tidak ditemukan</h1>
        <p className="text-sm text-fg-muted">Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
        <Link to="/">
          <Button variant="primary" size="md">Kembali ke Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
