import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BarChart3, PiggyBank, Shield, TrendingUp, Wallet, Target, Lock } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-[#60241E] selection:text-white font-sans overflow-hidden relative">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#E77B49]/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[50%] rounded-full bg-[#60241E]/10 blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed w-full z-50 border-b border-white/20 bg-white/60 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#60241E] to-[#B34A44] flex items-center justify-center text-white shadow-sm">
                <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">FinansialApp</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-600 hover:text-[#60241E] font-medium hidden sm:flex">
                Masuk
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-[#60241E] hover:bg-[#95271D] text-white shadow-md transition-all hover:shadow-lg font-medium">
                Mulai Gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 container mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-white/80 border border-slate-200 shadow-sm px-3 py-1.5 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-[#E77B49] animate-pulse"></span>
            <span className="text-sm font-medium text-slate-600">Keamanan Enkripsi Setara Bank</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-slate-900 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Kendalikan Masa Depan <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-[#60241E] via-[#95271D] to-[#E77B49] bg-clip-text text-transparent">
              Finansial Anda
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 leading-relaxed">
            Satu aplikasi pintar untuk melacak setiap transaksi, mengatur anggaran, dan mewujudkan impian finansial Anda tanpa ribet.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 px-8 text-lg bg-[#60241E] hover:bg-[#95271D] shadow-xl shadow-[#60241E]/20 transition-all hover:scale-105">
                Mulai Perjalanan Anda
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-14 px-8 text-lg border-slate-300 text-slate-700 hover:bg-slate-100 transition-all">
                Masuk ke Dasbor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="container mx-auto px-4 py-10 lg:py-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Dirancang untuk Kesuksesan Anda</h2>
          <p className="text-lg text-slate-600">Alat profesional yang dibalut dalam antarmuka yang sangat mudah digunakan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Large Card */}
          <div className="md:col-span-2 row-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#E77B49]/10 to-transparent rounded-bl-full pointer-events-none" />
            <div className="h-12 w-12 rounded-xl bg-[#60241E]/10 flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-[#60241E]" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Analitik & Laporan Mendalam</h3>
            <p className="text-slate-600 text-lg mb-8 max-w-md">
                Lacak setiap sen uang Anda. Visualisasi grafik interaktif kami memberi Anda wawasan instan ke mana perginya penghasilan Anda setiap bulannya.
            </p>
            {/* Mockup visual */}
            <div className="w-full h-48 bg-slate-50 border border-slate-100 rounded-2xl p-4 overflow-hidden relative">
                <div className="absolute bottom-0 left-0 w-full h-32 flex items-end justify-around px-4 gap-2">
                    {[40, 70, 45, 90, 60, 100, 50, 80].map((h, i) => (
                        <div key={i} className="w-full rounded-t-sm bg-gradient-to-t from-[#B34A44] to-[#E77B49]" style={{ height: `${h}%` }}></div>
                    ))}
                </div>
            </div>
          </div>

          {/* Small Card 1 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-all group">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Multi-Dompet</h3>
            <p className="text-slate-600">
                Pisahkan uang tunai, bank, dan e-wallet Anda agar tidak tercampur aduk.
            </p>
          </div>

          {/* Small Card 2 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-all group">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                <Target className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Tujuan Finansial</h3>
            <p className="text-slate-600">
                Targetkan impian Anda (liburan, rumah, mobil) dan pantau progresnya secara otomatis.
            </p>
          </div>
          
          {/* Wide Card */}
          <div className="md:col-span-3 bg-gradient-to-r from-[#60241E] to-[#95271D] rounded-3xl p-8 md:p-12 shadow-lg text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                <Shield className="w-96 h-96 -mt-20 -mr-20" />
            </div>
            <div className="z-10 mb-8 md:mb-0 max-w-xl">
                <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full mb-4 border border-white/20">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm font-medium">Privasi Terjamin</span>
                </div>
                <h3 className="text-3xl font-bold mb-4">Keamanan Data adalah Prioritas Kami</h3>
                <p className="text-white/80 text-lg">
                    Sistem autentikasi berlapis dan enkripsi terkini memastikan data keuangan Anda hanya dapat diakses oleh Anda. Tidak ada kompromi untuk privasi.
                </p>
            </div>
            <div className="z-10 w-full md:w-auto">
                <Link href="/auth/register">
                    <Button className="w-full md:w-auto h-14 px-8 text-lg bg-white text-[#60241E] hover:bg-slate-100 font-semibold shadow-xl">
                        Daftar Sekarang
                    </Button>
                </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 border-t border-slate-200 bg-white relative z-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-8">
            Dipercaya untuk mencatat
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
             <div className="text-4xl font-black text-slate-300">100K+ Transaksi</div>
             <div className="text-4xl font-black text-slate-300">Milyaran Rupiah</div>
             <div className="text-4xl font-black text-slate-300">Impian Tercapai</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 relative z-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <TrendingUp className="h-6 w-6 text-[#95271D]" />
            <span className="font-bold text-slate-700">FinansialApp</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} FinansialApp. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}