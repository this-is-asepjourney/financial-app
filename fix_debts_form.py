import os

filepath = 'src/app/(dashboard)/debts/page.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace the entire DialogContent grid with dynamic labels and wallet dropdown
old_form = """                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <Label>Nama Utang/Kredit</Label>
                                <Input
                                    required
                                    value={form.name}
                                    onChange={e => setFormField('name', e.target.value)}
                                    placeholder="Contoh: KPR Rumah Cilandak, Kartu Kredit BCA"
                                />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Jenis Utang</Label>
                                <Select value={form.type} onValueChange={v => setFormField('type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {DEBT_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Total Utang Awal (Rp)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">Rp</span>
                                    <Input
                                        required
                                        className="pl-9"
                                        value={formatNumber(form.totalAmount)}
                                        onChange={e => setFormField('totalAmount', e.target.value.replace(/\D/g, ''))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Sisa Utang Saat Ini (Rp)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">Rp</span>
                                    <Input
                                        required
                                        className="pl-9"
                                        value={formatNumber(form.remainingAmount)}
                                        onChange={e => setFormField('remainingAmount', e.target.value.replace(/\D/g, ''))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Cicilan per Bulan (Rp)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">Rp</span>
                                    <Input
                                        required
                                        className="pl-9"
                                        value={formatNumber(form.monthlyPayment)}
                                        onChange={e => setFormField('monthlyPayment', e.target.value.replace(/\D/g, ''))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Bunga per Tahun (%) <span className="text-muted-foreground font-normal">– Opsional</span></Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={form.interestRate}
                                        onChange={e => setFormField('interestRate', e.target.value)}
                                        placeholder="Contoh: 12.5"
                                    />
                                    <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Tanggal Jatuh Tempo <span className="text-muted-foreground font-normal">– Opsional</span></Label>
                                <Input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={e => setFormField('dueDate', e.target.value)}
                                />
                            </div>
                        </div>"""

new_form = """                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <Label>{activeTab === 'debt' ? 'Nama Utang/Kredit' : 'Nama Peminjam / Tujuan Piutang'}</Label>
                                <Input
                                    required
                                    value={form.name}
                                    onChange={e => setFormField('name', e.target.value)}
                                    placeholder={activeTab === 'debt' ? "Contoh: KPR Rumah Cilandak, Kartu Kredit BCA" : "Contoh: Budi, Kasbon Karyawan"}
                                />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>{activeTab === 'debt' ? 'Jenis Utang' : 'Jenis Piutang'}</Label>
                                <Select value={form.type} onValueChange={v => setFormField('type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(activeTab === 'debt' ? DEBT_TYPES : RECEIVABLE_TYPES).map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>{activeTab === 'debt' ? 'Total Utang Awal (Rp)' : 'Total Pinjaman (Rp)'}</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">Rp</span>
                                    <Input
                                        required
                                        className="pl-9"
                                        value={formatNumber(form.totalAmount)}
                                        onChange={e => setFormField('totalAmount', e.target.value.replace(/\\D/g, ''))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>{activeTab === 'debt' ? 'Sisa Utang Saat Ini (Rp)' : 'Sisa Piutang Saat Ini (Rp)'}</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">Rp</span>
                                    <Input
                                        required
                                        className="pl-9"
                                        value={formatNumber(form.remainingAmount)}
                                        onChange={e => setFormField('remainingAmount', e.target.value.replace(/\\D/g, ''))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>{activeTab === 'debt' ? 'Cicilan per Bulan (Rp)' : 'Ekspektasi Cicilan Masuk (Rp)'}</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">Rp</span>
                                    <Input
                                        required
                                        className="pl-9"
                                        value={formatNumber(form.monthlyPayment)}
                                        onChange={e => setFormField('monthlyPayment', e.target.value.replace(/\\D/g, ''))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Bunga per Tahun (%) <span className="text-muted-foreground font-normal">– Opsional</span></Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={form.interestRate}
                                        onChange={e => setFormField('interestRate', e.target.value)}
                                        placeholder="Contoh: 12.5"
                                    />
                                    <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Tanggal Jatuh Tempo <span className="text-muted-foreground font-normal">– Opsional</span></Label>
                                <Input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={e => setFormField('dueDate', e.target.value)}
                                />
                            </div>
                            {!editingDebt && (
                                <div className="col-span-2 space-y-1.5 mt-2">
                                    <Label>{activeTab === 'debt' ? 'Tujuan Dana (Opsional)' : 'Sumber Dana (Opsional)'}</Label>
                                    <Select value={form.walletId} onValueChange={v => setFormField('walletId', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih dompet..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {wallets.map(w => (
                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Jika dipilih, saldo dompet akan otomatis disesuaikan</p>
                                </div>
                            )}
                        </div>"""

content = content.replace(old_form, new_form)

# Also fix the submit button wording
content = content.replace("{isSubmitting ? 'Menyimpan...' : editingDebt ? 'Simpan Perubahan' : 'Tambah Utang'}", "{isSubmitting ? 'Menyimpan...' : editingDebt ? 'Simpan Perubahan' : activeTab === 'debt' ? 'Tambah Utang' : 'Tambah Piutang'}")

with open(filepath, 'w') as f:
    f.write(content)

print("Form fixed")
