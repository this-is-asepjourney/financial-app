import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const wallets = await prisma.wallet.findMany({
        include: {
            transactionsFrom: true,
            transactionsTo: true
        }
    })

    console.log(`Mengecek ${wallets.length} dompet...`)

    for (const wallet of wallets) {
        let calculatedBalance = 0
        wallet.transactionsFrom.forEach(t => {
            if (t.type === 'income') calculatedBalance += t.amount
            if (t.type === 'expense' || t.type === 'transfer') calculatedBalance -= t.amount
        })
        wallet.transactionsTo.forEach(t => {
            if (t.type === 'transfer') calculatedBalance += t.amount
        })

        const diff = wallet.balance - calculatedBalance

        if (diff !== 0) {
            console.log(`Dompet "${wallet.name}" memiliki selisih. Saldo asli: ${wallet.balance}, Kalkulasi dari transaksi: ${calculatedBalance}. Selisih: ${diff}`)
            
            await prisma.transaction.create({
                data: {
                    userId: wallet.userId,
                    amount: Math.abs(diff),
                    type: diff > 0 ? 'income' : 'expense',
                    description: diff > 0 ? 'Saldo Awal (Penyesuaian)' : 'Penyesuaian Saldo',
                    date: new Date(), // Use today's date so it shows up in this month's report
                    walletId: wallet.id,
                }
            })
            
            console.log(`✅ Berhasil membuat transaksi penyesuaian sebesar ${Math.abs(diff)} (${diff > 0 ? 'Pemasukan' : 'Pengeluaran'}) untuk dompet "${wallet.name}".`)
        } else {
            console.log(`Dompet "${wallet.name}" sudah seimbang.`)
        }
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
