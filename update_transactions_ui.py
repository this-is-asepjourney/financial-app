import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\transactions\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update transaction cards styling to be more premium
old_card = """                                <div
                                    key={transaction.id}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/20 border rounded-lg hover:bg-muted/40 transition-colors gap-4 sm:gap-0"
                                >
                                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: transaction.category?.color ? transaction.category.color + '20' : 'rgba(0,0,0,0.05)' }}
                                        >
                                            {transaction.type === 'income' ? (
                                                <TrendingUp className="h-6 w-6 text-green-600" />
                                            ) : transaction.type === 'expense' ? (
                                                <TrendingDown className="h-6 w-6 text-red-600" />
                                            ) : (
                                                <ArrowRightLeft className="h-6 w-6 text-purple-600" />
                                            )}
                                        </div>"""

new_card = """                                <div
                                    key={transaction.id}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 gap-4 sm:gap-0"
                                >
                                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                transaction.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' 
                                                : transaction.type === 'expense' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                                                : 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'
                                            }`}
                                        >
                                            {transaction.type === 'income' ? (
                                                <TrendingUp className="h-6 w-6" />
                                            ) : transaction.type === 'expense' ? (
                                                <TrendingDown className="h-6 w-6" />
                                            ) : (
                                                <ArrowRightLeft className="h-6 w-6" />
                                            )}
                                        </div>"""
content = content.replace(old_card, new_card)

# Update the card header layout for Transactions List
old_header = """            {/* Transactions List */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Daftar Transaksi</CardTitle>"""
new_header = """            {/* Transactions List */}
            <Card className="border-t-4 border-t-indigo-500 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="text-xl">Daftar Transaksi</CardTitle>"""
content = content.replace(old_header, new_header)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
