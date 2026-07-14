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

def add_imports(content):
    if "getServerSession" not in content:
        content = re.sub(
            r"(import \{ NextResponse \} from 'next/server')",
            r"\1\nimport { getServerSession } from 'next-auth'\nimport { authOptions } from '@/lib/auth'",
            content
        )
    return content

def fix_get(content):
    # Pattern to match GET function and replace userId extraction
    # We want to replace:
    # const { searchParams } = new URL(request.url)
    # const userId = searchParams.get('userId')
    # if (!userId) { ... }
    
    # Or just inject session check at the beginning of try block.
    # We can match: "try {\n" and inject session check.
    
    # Actually, it's safer to just do a general regex replacement for userId handling in GET
    # Replace searchParams.get('userId') or similar logic.
    pass

for file in api_files:
    if not os.path.exists(file): continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add imports
    content = add_imports(content)
    
    # 2. Inject Session check into GET/POST/PUT/DELETE
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    for method in methods:
        pattern = r"(export async function " + method + r"\([^\)]*\)\s*\{\s*try\s*\{)"
        replacement = r"\1\n        const session = await getServerSession(authOptions)\n        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })\n        const userId = session.user.id\n"
        
        # We need to make sure we don't inject multiple times or have duplicate const userId
        # If we inject const userId = session.user.id, we need to remove the old userId extraction.
        
        if re.search(pattern, content):
            # First, comment out or remove old userId extractions
            content = re.sub(r"const\s+userId\s*=\s*searchParams\.get\(['\"]userId['\"]\)", "/* userId from session */", content)
            content = re.sub(r"const\s+\{\s*userId\s*(?:,[^}]*)?\}\s*=\s*(?:await\s+)?request\.json\(\)", "const { /* userId removed, */ ...restBody } = await request.json()", content) # This is risky if destructuring other things.
            
            # Let's just do it manually for safety if it's too complex... Wait, python script can be smart.
            pass

