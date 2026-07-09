import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, BarChart3, PiggyBank, Shield, TrendingUp } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: BarChart3,
      title: 'Laporan Keuangan',
      description: 'Pantau pemasukan dan pengeluaran dengan grafik interaktif',
    },
    {
      icon: PiggyBank,
      title: 'Manajemen Budget',
      description: 'Atur budget per kategori dan lacak pengeluaran Anda',
    },
    {
      icon: TrendingUp,
      title: 'Goal Tracking',
      description: 'Tetapkan target keuangan dan pantau progresnya',
    },
    {
      icon: Shield,
      title: 'Financial Health',
      description: 'Dapatkan skor kesehatan finansial dan rekomendasi',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold">FinansialApp</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Masuk</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Daftar Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Kelola Keuangan dengan Lebih Cerdas
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Lacak pengeluaran, atur budget, capai tujuan finansial, dan dapatkan
            skor kesehatan keuangan Anda dalam satu aplikasi.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg">
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg">
                Lihat Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Fitur Lengkap untuk Kesehatan Finansial Anda
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <feature.icon className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">50K+</div>
              <div className="text-gray-600">Pengguna Aktif</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">100M+</div>
              <div className="text-gray-600">Transaksi Tercatat</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">4.9</div>
              <div className="text-gray-600">Rating Pengguna</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; 2024 FinansialApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}