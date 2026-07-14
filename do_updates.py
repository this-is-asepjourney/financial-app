import os
import re

api_files = [
    "src/app/api/budgets/route.ts",
    "src/app/api/budgets/[id]/route.ts",
    "src/app/api/categories/route.ts",
    "src/app/api/categories/[id]/route.ts",
    "src/app/api/financial-health/route.ts",
    "src/app/api/goals/route.ts",
    "src/app/api/goals/[id]/route.ts",
    "src/app/api/reports/category-analysis/route.ts",
    "src/app/api/reports/monthly-summary/route.ts",
    "src/app/api/transactions/route.ts",
    "src/app/api/transactions/[id]/route.ts",
    "src/app/api/user/settings/route.ts",
    "src/app/api/wallets/route.ts",
    "src/app/api/wallets/[id]/route.ts"
]

for file_path in api_files:
    if not os.path.exists(file_path): continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add imports if missing
    if "getServerSession" not in content:
        content = content.replace("import { NextResponse } from 'next/server'", 
                                  "import { NextResponse } from 'next/server'\nimport { getServerSession } from 'next-auth'\nimport { authOptions } from '@/lib/auth'")

    def inject_session(match):
        func_sig = match.group(1)
        try_block = match.group(2)
        return f"{func_sig}    {try_block}\n        const session = await getServerSession(authOptions)\n        if (!session?.user?.id) return NextResponse.json({{ error: 'Unauthorized' }}, {{ status: 401 }})\n        const userId = session.user.id\n"
        
    content = re.sub(r"(export async function [A-Z]+\([^)]*\)\s*\{[\r\n]+)(\s*try\s*\{)", inject_session, content)
    
    content = re.sub(r"\s*const userId = searchParams\.get\('userId'\);?[\r\n]+", "\n", content)
    content = re.sub(r"\s*if \(!userId\) \{\s*return NextResponse\.json\(\{ error: 'User ID diperlukan' \}, \{ status: 400 \}\);?\s*\}[\r\n]+", "\n", content)
    content = re.sub(r"\s*const userId = body\.userId;?[\r\n]+", "\n", content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done API Updates")
