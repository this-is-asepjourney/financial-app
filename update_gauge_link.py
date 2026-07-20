import re

file_path = r'd:\repository\financial-app\src\components\charts\FinancialScoreGauge.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add next/link import
if "import Link from 'next/link'" not in content:
    content = content.replace("import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'",
                              "import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'\nimport Link from 'next/link'\nimport { ChevronRight } from 'lucide-react'")

# Change the CardHeader to include the link
old_header = """            <CardHeader>
                <CardTitle>Skor Kesehatan Finansial</CardTitle>
            </CardHeader>"""
new_header = """            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Skor Kesehatan Finansial</CardTitle>
                <Link href="/financial-health" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                    Detail & Simulasi <ChevronRight className="h-4 w-4" />
                </Link>
            </CardHeader>"""
content = content.replace(old_header, new_header)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
