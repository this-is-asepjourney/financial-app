import re

file_path = r'd:\repository\financial-app\src\app\api\reports\category-analysis\route.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add logic to fetch firstTransactionDate when timeframe is 'all'
old_fetch = """        const analysisWithPercentage = analysis.map((item) => ({
            ...item,
            percentage: totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0,
        }))

        return NextResponse.json({
            analysis: analysisWithPercentage,
            totalAmount,
        })"""

new_fetch = """        const analysisWithPercentage = analysis.map((item) => ({
            ...item,
            percentage: totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0,
        }))

        let firstTransactionDate = null
        if (timeframe === 'all') {
            const firstTx = await prisma.transaction.findFirst({
                where: { userId, type },
                orderBy: { date: 'asc' },
                select: { date: true }
            })
            if (firstTx) {
                firstTransactionDate = firstTx.date
            }
        }

        return NextResponse.json({
            analysis: analysisWithPercentage,
            totalAmount,
            firstTransactionDate
        })"""

content = content.replace(old_fetch, new_fetch)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
