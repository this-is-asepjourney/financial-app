import re

file_path = r'd:\repository\financial-app\src\app\api\debts\[id]\pay\route.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

helper = """
async function getOrCreateCategory(tx: any, userId: string, type: 'income' | 'expense') {
    const catName = type === 'income' ? 'Pemasukan Piutang/Utang' : 'Tagihan & Pembayaran';
    let cat = await tx.category.findFirst({
        where: { userId, name: catName, type }
    });
    if (!cat) {
        cat = await tx.category.create({
            data: {
                userId,
                name: catName,
                type,
                color: type === 'income' ? '#10B981' : '#F43F5E',
                isDebtPayment: type === 'expense' ? true : false,
            }
        });
    }
    return cat.id;
}
"""

if "getOrCreateCategory" not in content:
    content += helper

old_tx = """                await tx.transaction.create({
                    data: {
                        userId,
                        amount,
                        type: txType,
                        walletId,
                        description: `Pelunasan ${debt.debtType === 'receivable' ? 'Piutang' : 'Utang'}: ${debt.name}`,
                        date: new Date(),
                    }
                })"""

new_tx = """                const categoryId = await getOrCreateCategory(tx, userId, txType);

                await tx.transaction.create({
                    data: {
                        userId,
                        amount,
                        type: txType,
                        categoryId,
                        walletId,
                        description: `Pelunasan ${debt.debtType === 'receivable' ? 'Piutang' : 'Utang'}: ${debt.name}`,
                        date: new Date(),
                    }
                })"""

content = content.replace(old_tx, new_tx)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
