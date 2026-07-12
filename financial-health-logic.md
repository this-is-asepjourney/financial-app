# Logika Perhitungan Financial Health Score

Dokumen ini menjelaskan algoritma penilaian kesehatan finansial berdasarkan prinsip-prinsip standar perencanaan keuangan (mengacu pada konsep yang umum dipakai Certified Financial Planner: savings rate, emergency fund ratio, debt-to-income ratio, budget adherence, dan wealth accumulation ratio), dipetakan langsung ke schema Prisma yang sudah ada.

---

## 1. Sumber Data dari Schema

| Metrik | Diambil dari model |
|---|---|
| Total Income bulanan | `Transaction` (type = "income"), agregat per bulan |
| Total Expense bulanan | `Transaction` (type = "expense"), agregat per bulan |
| Saldo likuid (cash/bank/ewallet) | `Wallet` (type = "bank" \| "ewallet" \| "cash"), sum `balance` |
| Aset investasi | `Investment.currentValue` (fallback ke `amount` jika currentValue null) |
| Kepatuhan anggaran | `Budget.spent` vs `Budget.amount` per kategori per bulan |
| Progress tujuan keuangan | `FinancialGoal.currentAmount` vs `targetAmount` (opsional, bonus score) |
| Output akhir | disimpan ke `FinancialHealth` (savingsRate, emergencyFundMonths, debtToIncomeRatio, financialScore) |

**Catatan penting:** schema saat ini belum punya model `Debt`/`Liability` eksplisit. Untuk menghitung Debt-to-Income Ratio yang akurat, idealnya tambahkan model `Debt` (cicilan, kartu kredit, pinjaman). Sebagai fallback sementara, DTI bisa didekati dari transaksi expense dengan `Category.name` yang mengandung kata kunci seperti "cicilan", "hutang", "kredit", "kartu kredit" — tapi ini kurang presisi. Rekomendasi ditambahkan di bagian akhir.

---

## 2. Lima Komponen Penilaian

Setiap komponen dihitung sebagai rasio mentah, lalu di-normalisasi ke skala 0–100 menggunakan fungsi clamp linear terhadap benchmark ahli. Skor akhir adalah rata-rata tertimbang.

### 2.1 Savings Rate (bobot 30%)

```
savingsRate = (totalIncome - totalExpenses) / totalIncome
```

Acuan pakar (aturan umum 20% sebagai target sehat, dipopulerkan lewat aturan budgeting 50/30/20):

| savingsRate | Score |
|---|---|
| ≥ 20% | 100 |
| 10% – 20% | scale linear 60→100 |
| 0% – 10% | scale linear 30→60 |
| < 0% (defisit) | 0 |

```ts
function scoreSavingsRate(rate: number): number {
  if (rate >= 0.20) return 100;
  if (rate >= 0.10) return 60 + ((rate - 0.10) / 0.10) * 40;
  if (rate >= 0) return 30 + (rate / 0.10) * 30;
  return 0;
}
```

### 2.2 Emergency Fund Ratio (bobot 25%)

```
emergencyFundMonths = totalLiquidBalance / avgMonthlyExpense
```

Acuan pakar (standar 3–6 bulan pengeluaran sebagai dana darurat ideal):

| bulan | Score |
|---|---|
| ≥ 6 bulan | 100 |
| 3 – 6 bulan | scale linear 70→100 |
| 1 – 3 bulan | scale linear 30→70 |
| < 1 bulan | scale linear 0→30 |

```ts
function scoreEmergencyFund(months: number): number {
  if (months >= 6) return 100;
  if (months >= 3) return 70 + ((months - 3) / 3) * 30;
  if (months >= 1) return 30 + ((months - 1) / 2) * 40;
  return Math.max(0, (months / 1) * 30);
}
```

### 2.3 Debt-to-Income Ratio (bobot 20%)

```
debtToIncomeRatio = totalMonthlyDebtPayment / totalMonthlyIncome
```

Acuan pakar (rasio utang terhadap pendapatan; <36% dianggap sehat, >43% dianggap berisiko tinggi — patokan yang juga dipakai lender untuk kelayakan kredit):

| DTI | Score |
|---|---|
| 0% | 100 |
| 0% – 20% | scale linear 100→80 |
| 20% – 36% | scale linear 80→60 |
| 36% – 43% | scale linear 60→30 |
| > 43% | scale linear 30→0 |

```ts
function scoreDTI(dti: number): number {
  if (dti <= 0) return 100;
  if (dti <= 0.20) return 100 - (dti / 0.20) * 20;
  if (dti <= 0.36) return 80 - ((dti - 0.20) / 0.16) * 20;
  if (dti <= 0.43) return 60 - ((dti - 0.36) / 0.07) * 30;
  return Math.max(0, 30 - ((dti - 0.43) / 0.20) * 30);
}
```

> Karena belum ada model Debt, sementara `totalMonthlyDebtPayment` bisa dihitung dari sum `Transaction.amount` yang `type = "expense"` dan `categoryId` merujuk ke kategori bertipe cicilan/utang (perlu flag tambahan di `Category`, misal kolom `isDebtPayment Boolean @default(false)`).

### 2.4 Budget Adherence (bobot 15%)

Mengukur seberapa disiplin user terhadap anggaran yang dia buat sendiri per kategori per bulan.

```
overspendRatio = sum(max(0, budget.spent - budget.amount)) / sum(budget.amount)
adherenceScore = 100 - (overspendRatio * 100), clamp 0-100
```

```ts
function scoreBudgetAdherence(budgets: { amount: number; spent: number }[]): number {
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  if (totalBudget === 0) return 50; // netral jika belum ada budget dibuat
  const overspend = budgets.reduce((s, b) => s + Math.max(0, b.spent - b.amount), 0);
  const ratio = overspend / totalBudget;
  return Math.max(0, 100 - ratio * 100);
}
```

### 2.5 Investment / Wealth Building Ratio (bobot 10%)

Mengukur proporsi kekayaan yang dialokasikan ke aset produktif (investasi) dibanding hanya menganggur di kas/tabungan — mencerminkan prinsip "pay yourself first" dan alokasi aset untuk pertumbuhan jangka panjang.

```
investmentRatio = totalInvestmentValue / (totalInvestmentValue + totalLiquidBalance)
```

| investmentRatio | Score |
|---|---|
| ≥ 30% | 100 |
| 10% – 30% | scale linear 50→100 |
| 0% – 10% | scale linear 20→50 |
| 0% (belum investasi sama sekali) | 20 |

```ts
function scoreInvestmentRatio(ratio: number): number {
  if (ratio >= 0.30) return 100;
  if (ratio >= 0.10) return 50 + ((ratio - 0.10) / 0.20) * 50;
  if (ratio > 0) return 20 + (ratio / 0.10) * 30;
  return 20;
}
```

---

## 3. Komposit Skor Akhir

```ts
const WEIGHTS = {
  savingsRate: 0.30,
  emergencyFund: 0.25,
  dti: 0.20,
  budgetAdherence: 0.15,
  investmentRatio: 0.10,
};

function calculateFinancialScore(input: {
  savingsRate: number;
  emergencyFundMonths: number;
  dti: number;
  budgets: { amount: number; spent: number }[];
  investmentRatio: number;
}): number {
  const s1 = scoreSavingsRate(input.savingsRate);
  const s2 = scoreEmergencyFund(input.emergencyFundMonths);
  const s3 = scoreDTI(input.dti);
  const s4 = scoreBudgetAdherence(input.budgets);
  const s5 = scoreInvestmentRatio(input.investmentRatio);

  const total =
    s1 * WEIGHTS.savingsRate +
    s2 * WEIGHTS.emergencyFund +
    s3 * WEIGHTS.dti +
    s4 * WEIGHTS.budgetAdherence +
    s5 * WEIGHTS.investmentRatio;

  return Math.round(total);
}
```

### Klasifikasi Skor Akhir

| Range | Label | Interpretasi |
|---|---|---|
| 80 – 100 | Sangat Sehat | Semua indikator dalam kondisi optimal |
| 65 – 79 | Sehat | Kondisi baik, ada 1-2 area perlu ditingkatkan |
| 50 – 64 | Cukup | Masih dalam batas wajar, tapi rentan |
| 35 – 49 | Kurang Sehat | Perlu perbaikan segera pada beberapa aspek |
| 0 – 34 | Tidak Sehat | Risiko finansial tinggi, butuh tindakan korektif |

---

## 4. Alur Perhitungan End-to-End (per user, per bulan)

```ts
async function generateFinancialHealth(userId: string, month: Date) {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // 1. Ambil transaksi bulan berjalan
  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
    include: { category: true },
  });

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  // 2. Dana darurat: saldo likuid seluruh wallet non-investasi
  const wallets = await prisma.wallet.findMany({ where: { userId } });
  const totalLiquidBalance = wallets.reduce((s, w) => s + w.balance, 0);

  // 3. Rata-rata pengeluaran 3 bulan terakhir (lebih stabil dari 1 bulan saja)
  const avgMonthlyExpense = await getAverageMonthlyExpense(userId, 3);
  const emergencyFundMonths = avgMonthlyExpense > 0
    ? totalLiquidBalance / avgMonthlyExpense
    : 0;

  // 4. DTI (sementara pakai kategori bertanda isDebtPayment)
  const debtPayments = transactions
    .filter(t => t.type === "expense" && t.category?.name?.toLowerCase().includes("cicilan"))
    .reduce((s, t) => s + t.amount, 0);
  const dti = totalIncome > 0 ? debtPayments / totalIncome : 0;

  // 5. Budget adherence bulan ini
  const budgets = await prisma.budget.findMany({
    where: { userId, month: startOfMonth },
  });

  // 6. Investment ratio
  const investments = await prisma.investment.findMany({ where: { userId } });
  const totalInvestmentValue = investments.reduce(
    (s, i) => s + (i.currentValue ?? i.amount), 0
  );
  const investmentRatio = totalInvestmentValue + totalLiquidBalance > 0
    ? totalInvestmentValue / (totalInvestmentValue + totalLiquidBalance)
    : 0;

  // 7. Hitung skor akhir
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;

  const financialScore = calculateFinancialScore({
    savingsRate,
    emergencyFundMonths,
    dti,
    budgets,
    investmentRatio,
  });

  // 8. Simpan ke FinancialHealth (upsert per userId+month)
  return prisma.financialHealth.upsert({
    where: { userId_month: { userId, month: startOfMonth } },
    update: {
      totalIncome,
      totalExpenses,
      totalSavings: totalIncome - totalExpenses,
      savingsRate,
      emergencyFundMonths,
      debtToIncomeRatio: dti,
      financialScore,
    },
    create: {
      userId,
      month: startOfMonth,
      totalIncome,
      totalExpenses,
      totalSavings: totalIncome - totalExpenses,
      savingsRate,
      emergencyFundMonths,
      debtToIncomeRatio: dti,
      financialScore,
    },
  });
}
```

---

## 5. Rekomendasi Pengembangan Lanjutan

1. **Tambahkan model `Debt`** agar DTI akurat, bukan pendekatan dari nama kategori:
   ```prisma
   model Debt {
     id            String    @id @default(uuid())
     userId        String
     name          String
     type          String    // kartu_kredit, kta, kpr, cicilan_kendaraan, pinjol
     totalAmount   Float
     remainingAmount Float
     monthlyPayment Float
     interestRate  Float?
     dueDate       DateTime?
     createdAt     DateTime  @default(now())

     user User @relation(fields: [userId], references: [id], onDelete: Cascade)
     @@index([userId])
   }
   ```
   Lalu DTI dihitung langsung dari `sum(Debt.monthlyPayment) / totalIncome`.

2. **Tambahkan flag `isDebtPayment` di `Category`** sebagai solusi cepat tanpa model baru, jika belum mau menambah tabel.

3. **Cron job bulanan**: jalankan `generateFinancialHealth` untuk semua user aktif via scheduler (queue job), sehingga histori `FinancialHealth` terbentuk otomatis tiap awal bulan untuk data bulan sebelumnya.

4. **Bobot bisa dijadikan konfigurasi per-tenant** kalau nanti mau dipasarkan sebagai SaaS multi-segmen (misalnya pekerja lepas vs karyawan tetap punya profil risiko emergency fund berbeda).

5. **Insight otomatis**: setelah skor dihitung, generate rekomendasi teks otomatis berdasarkan komponen mana yang paling rendah (misal: "Dana darurat Anda hanya cukup 1.2 bulan, targetkan 3-6 bulan pengeluaran").
