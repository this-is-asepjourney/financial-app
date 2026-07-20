import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\financial-health\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_imp = """    AlertTriangle,
    CheckCircle
} from 'lucide-react'"""
new_imp = """    AlertTriangle,
    CheckCircle,
    Bot,
    Sparkles
} from 'lucide-react'"""
content = content.replace(old_imp, new_imp)

old_alert = """                                        {isBoros && (
                                            <p className="text-sm text-rose-600 font-medium">
                                                Saldo Anda berisiko habis sebelum waktu gajian tiba. Kurangi pengeluaran 'Wants' (keinginan) Anda sekarang!
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>"""
new_alert = """                                        {isBoros && (
                                            <p className="text-sm text-rose-600 font-medium">
                                                Saldo Anda berisiko habis sebelum waktu gajian tiba. Kurangi pengeluaran 'Wants' (keinginan) Anda sekarang!
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                                
                                {/* AI Analyst Persona */}
                                <div className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 p-4 sm:p-5">
                                    <div className="flex gap-3 items-start">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-2">
                                            <h5 className="font-semibold text-sm text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                                AI Financial Analyst <Sparkles className="h-3 w-3 text-amber-500" />
                                            </h5>
                                            
                                            {isBoros ? (
                                                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                                    <p>
                                                        Halo! Berdasarkan analisis data transaksi Anda, pembengkakan pengeluaran terbesar bersumber dari <strong>{realData.topWantsCategory?.name || 'Keinginan'}</strong> dengan total <strong>Rp{realData.topWantsCategory?.amount?.toLocaleString('id-ID') || 0}</strong>.
                                                    </p>
                                                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 mt-2">
                                                        <strong className="text-indigo-800 dark:text-indigo-300">💡 Solusi & Saran:</strong>
                                                        <ul className="list-disc pl-4 mt-1 space-y-1">
                                                            <li>Tunda sementara pengeluaran untuk <strong>{realData.topWantsCategory?.name || 'Keinginan'}</strong> selama <strong>{Math.ceil(daysLeft)} hari</strong> ke depan.</li>
                                                            <li>Fokuskan sisa saldo Anda HANYA untuk menopang kebutuhan esensial seperti <strong>{realData.topNeedsCategory?.name || 'Kebutuhan'}</strong>.</li>
                                                            <li>Jika Anda menggunakan Paylater atau Kartu Kredit, hentikan penggunaannya bulan ini untuk mencegah utang menumpuk.</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            ) : isSafe ? (
                                                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                                    <p>
                                                        Luar biasa! Manajemen arus kas Anda sangat sehat. Anda berhasil menekan pengeluaran <strong>{realData.topWantsCategory?.name || 'Keinginan'}</strong> Anda di angka yang wajar (Rp{realData.topWantsCategory?.amount?.toLocaleString('id-ID') || 0}).
                                                    </p>
                                                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 mt-2">
                                                        <strong className="text-indigo-800 dark:text-indigo-300">💡 Saran Lanjutan:</strong>
                                                        <ul className="list-disc pl-4 mt-1 space-y-1">
                                                            <li>Pertahankan ritme ini selama <strong>{Math.ceil(daysLeft)} hari</strong> ke depan.</li>
                                                            <li>Jika di akhir siklus gajian nanti masih ada sisa uang bulanan, segera alokasikan ke <strong>Dana Darurat</strong> atau <strong>Investasi</strong> sebelum gajian berikutnya masuk!</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                                    <p>
                                                        Halo! Arus kas Anda saat ini sedang berada di ambang batas wajar. Kebutuhan terbesar Anda ada di <strong>{realData.topNeedsCategory?.name || 'Kebutuhan'}</strong> (Rp{realData.topNeedsCategory?.amount?.toLocaleString('id-ID') || 0}), sedangkan pengeluaran sekunder terbesar ada di <strong>{realData.topWantsCategory?.name || 'Keinginan'}</strong>.
                                                    </p>
                                                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 mt-2">
                                                        <strong className="text-indigo-800 dark:text-indigo-300">💡 Saran Penyesuaian:</strong>
                                                        <ul className="list-disc pl-4 mt-1 space-y-1">
                                                            <li>Berhati-hatilah agar pengeluaran sekunder (Wants) tidak melebar di <strong>{Math.ceil(daysLeft)} hari</strong> terakhir ini.</li>
                                                            <li>Catat setiap transaksi sekecil apapun agar Anda tidak melewati batas aman sebelum gajian tiba.</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>"""
content = content.replace(old_alert, new_alert)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
