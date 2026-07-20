import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\financial-health\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the AI Analyst logic block
old_logic = """                                        <div className="space-y-2">
                                            <h5 className="font-semibold text-sm text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                                AI Financial Analyst <Sparkles className="h-3 w-3 text-amber-500" />
                                            </h5>
                                            
                                            {isBoros ? ("""

# Replace it with logic variables and the new text
new_logic = """                                        <div className="space-y-2">
                                            <h5 className="font-semibold text-sm text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                                AI Financial Analyst <Sparkles className="h-3 w-3 text-amber-500" />
                                            </h5>
                                            
                                            {(() => {
                                                const topWantsName = realData.topWantsCategory?.name || 'Keinginan';
                                                const topNeedsName = realData.topNeedsCategory?.name || 'Kebutuhan';
                                                const topWantsLower = topWantsName.toLowerCase();
                                                
                                                let borosCause = `pembengkakan pengeluaran terbesar bersumber dari <strong>${topWantsName}</strong>`;
                                                let borosAdvice1 = `Tunda sementara pengeluaran untuk <strong>${topWantsName}</strong> selama <strong>${Math.ceil(daysLeft)} hari</strong> ke depan.`;
                                                
                                                if (topWantsLower.includes('piutang') || topWantsLower.includes('pinjaman')) {
                                                    borosCause = `banyaknya uang kas yang keluar untuk <strong>Memberikan Pinjaman (Piutang)</strong>`;
                                                    borosAdvice1 = `Tunda sementara niat memberikan <strong>pinjaman / piutang</strong> kepada orang lain selama <strong>${Math.ceil(daysLeft)} hari</strong> ke depan. Amankan arus kas Anda sendiri terlebih dahulu!`;
                                                } else if (topWantsLower.includes('tagihan') || topWantsLower.includes('utang') || topWantsLower.includes('cicilan')) {
                                                    borosCause = `besarnya porsi pembayaran <strong>${topWantsName}</strong>`;
                                                    borosAdvice1 = `Fokus pada pelunasan yang mendesak, tapi JANGAN menambah beban utang baru selama <strong>${Math.ceil(daysLeft)} hari</strong> ke depan.`;
                                                }

                                                return isBoros ? (
                                                    <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                                        <p>
                                                            Halo! Berdasarkan analisis data transaksi Anda, {borosCause} dengan total <strong>Rp{realData.topWantsCategory?.amount?.toLocaleString('id-ID') || 0}</strong>.
                                                        </p>
                                                        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 mt-2">
                                                            <strong className="text-indigo-800 dark:text-indigo-300">💡 Solusi & Saran:</strong>
                                                            <ul className="list-disc pl-4 mt-1 space-y-1">
                                                                <li dangerouslySetInnerHTML={{ __html: borosAdvice1 }}></li>
                                                                <li>Fokuskan sisa saldo Anda HANYA untuk menopang kebutuhan esensial seperti <strong>{topNeedsName}</strong>.</li>
                                                                <li>Jika Anda menggunakan Paylater atau Kartu Kredit, hentikan penggunaannya bulan ini untuk mencegah defisit berkelanjutan.</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                ) : isSafe ? (
                                                    <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                                        <p>
                                                            Luar biasa! Manajemen arus kas Anda sangat sehat. Anda berhasil menekan pengeluaran <strong>{topWantsName}</strong> Anda di angka yang wajar (Rp{realData.topWantsCategory?.amount?.toLocaleString('id-ID') || 0}).
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
                                                            Halo! Arus kas Anda saat ini sedang berada di ambang batas wajar. Kebutuhan terbesar Anda ada di <strong>{topNeedsName}</strong> (Rp{realData.topNeedsCategory?.amount?.toLocaleString('id-ID') || 0}), sedangkan pengeluaran sekunder terbesar ada di <strong>{topWantsName}</strong>.
                                                        </p>
                                                        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 mt-2">
                                                            <strong className="text-indigo-800 dark:text-indigo-300">💡 Saran Penyesuaian:</strong>
                                                            <ul className="list-disc pl-4 mt-1 space-y-1">
                                                                <li>Berhati-hatilah agar pengeluaran sekunder (Wants) tidak melebar di <strong>{Math.ceil(daysLeft)} hari</strong> terakhir ini.</li>
                                                                <li>Catat setiap transaksi sekecil apapun agar Anda tidak melewati batas aman sebelum gajian tiba.</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>"""

# Replace the block up to the end of the AI Analyst Persona div
pattern = r"""                                        <div className="space-y-2">
                                            <h5 className="font-semibold text-sm text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                                AI Financial Analyst <Sparkles className="h-3 w-3 text-amber-500" />
                                            </h5>.*?</ul>\s*</div>\s*</div>\s*\)\s*}\s*</div>"""

content = re.sub(pattern, new_logic, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
