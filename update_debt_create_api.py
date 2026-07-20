import re

file_path = r'd:\repository\financial-app\src\app\api\debts\route.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add getOrCreateCategory helper
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

# Update transaction creation
old_tx = """                await tx.transaction.create({
                    data: {
                        userId,
                        amount: parsedTotal,
                        type: actualDebtType === 'receivable' ? 'expense' : 'income',
                        walletId,
                        description: `${actualDebtType === 'receivable' ? 'Piutang' : 'Utang'}: ${name}`,
                        date: new Date(),
                    }
                })"""

new_tx = """                const txType = actualDebtType === 'receivable' ? 'expense' : 'income';
                const categoryId = await getOrCreateCategory(tx, userId, txType);

                await tx.transaction.create({
                    data: {
                        userId,
                        amount: parsedTotal,
                        type: txType,
                        categoryId,
                        walletId,
                        description: `${actualDebtType === 'receivable' ? 'Piutang' : 'Utang'}: ${name}`,
                        date: new Date(),
                    }
                })"""

content = content.replace(old_tx, new_tx)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
