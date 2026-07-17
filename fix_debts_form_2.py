import os
import re

filepath = 'src/app/(dashboard)/debts/page.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Dialog description
content = content.replace(
    "{editingDebt\n                                ? 'Perbarui informasi utang Anda'\n                                : 'Catat kewajiban finansial untuk memantau kesehatan keuangan'}",
    "{editingDebt ? (activeTab === 'debt' ? 'Perbarui informasi utang Anda' : 'Perbarui informasi piutang Anda') : (activeTab === 'debt' ? 'Catat kewajiban finansial untuk memantau kesehatan keuangan' : 'Catat uang yang Anda pinjamkan ke pihak lain')}"
)

# 2. Nama Utang/Kredit
content = content.replace(
    "<Label>Nama Utang/Kredit</Label>",
    "<Label>{activeTab === 'debt' ? 'Nama Utang/Kredit' : 'Nama Peminjam / Tujuan Piutang'}</Label>"
)
content = content.replace(
    "placeholder=\"Contoh: KPR Rumah Cilandak, Kartu Kredit BCA\"",
    "placeholder={activeTab === 'debt' ? 'Contoh: KPR Rumah Cilandak, Kartu Kredit BCA' : 'Contoh: Budi, Kasbon Karyawan'}"
)

# 3. Jenis Utang
content = content.replace(
    "<Label>Jenis Utang</Label>",
    "<Label>{activeTab === 'debt' ? 'Jenis Utang' : 'Jenis Piutang'}</Label>"
)
content = content.replace(
    "{DEBT_TYPES.map(t => (",
    "{(activeTab === 'debt' ? DEBT_TYPES : RECEIVABLE_TYPES).map(t => ("
)

# 4. Total Utang Awal (Rp)
content = content.replace(
    "<Label>Total Utang Awal (Rp)</Label>",
    "<Label>{activeTab === 'debt' ? 'Total Utang Awal (Rp)' : 'Total Pinjaman (Rp)'}</Label>"
)

# 5. Sisa Utang Saat Ini (Rp)
content = content.replace(
    "<Label>Sisa Utang Saat Ini (Rp)</Label>",
    "<Label>{activeTab === 'debt' ? 'Sisa Utang Saat Ini (Rp)' : 'Sisa Piutang Saat Ini (Rp)'}</Label>"
)

# 6. Cicilan per Bulan (Rp)
content = content.replace(
    "<Label>Cicilan per Bulan (Rp)</Label>",
    "<Label>{activeTab === 'debt' ? 'Cicilan per Bulan (Rp)' : 'Ekspektasi Cicilan Masuk (Rp)'}</Label>"
)

# 7. Add wallet dropdown before DialogFooter
wallet_dropdown = """                            {!editingDebt && (
                                <div className="col-span-2 space-y-1.5 mt-2">
                                    <Label>{activeTab === 'debt' ? 'Tujuan Dana (Opsional)' : 'Sumber Dana (Opsional)'}</Label>
                                    <Select value={form.walletId} onValueChange={v => setFormField('walletId', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih dompet..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(wallets || []).map(w => (
                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Jika dipilih, saldo dompet akan otomatis disesuaikan</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="pt-2">"""
content = content.replace("                        </div>\n                        <DialogFooter className=\"pt-2\">", wallet_dropdown)

# 8. Button text
content = content.replace(
    "{isSubmitting ? 'Menyimpan...' : editingDebt ? 'Simpan Perubahan' : 'Tambah Utang'}",
    "{isSubmitting ? 'Menyimpan...' : editingDebt ? 'Simpan Perubahan' : (activeTab === 'debt' ? 'Tambah Utang' : 'Tambah Piutang')}"
)

with open(filepath, 'w') as f:
    f.write(content)

print("Form fixed successfully.")
