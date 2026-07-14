import os
import re

files_to_update = [
    "src/app/(dashboard)/layout.tsx",
    "src/app/(dashboard)/dashboard/page.tsx",
    "src/app/(dashboard)/transactions/page.tsx",
    "src/app/(dashboard)/budget/page.tsx",
    "src/app/(dashboard)/goals/page.tsx",
    "src/app/(dashboard)/wallets/page.tsx",
    "src/app/(dashboard)/categories/page.tsx",
    "src/app/(dashboard)/reports/page.tsx",
    "src/app/(dashboard)/financial-health/page.tsx",
    "src/app/(dashboard)/settings/page.tsx"
]

for file_path in files_to_update:
    if not os.path.exists(file_path): continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Import replacement
    if "useSession" not in content and "next-auth/react" not in content:
        content = content.replace("import { useAuthStore } from '@/store/auth-store'", "import { useSession, signOut } from 'next-auth/react'")
        
        # In case we need signOut only in layout
        if "layout.tsx" not in file_path:
            content = content.replace(", signOut", "")

    # State extraction replacement
    content = re.sub(r"const user = useAuthStore\(\(state\) => state\.user\)", "const { data: session } = useSession()\n    const user = session?.user", content)
    
    # Handle layout specifically for logout
    if "layout.tsx" in file_path:
        content = re.sub(r"const logout = useAuthStore\(\(state\) => state\.logout\)", "", content)
        content = re.sub(r"logout\(\)", "signOut({ callbackUrl: '/' })", content)

    # Some pages might check if (!user) router.push('/auth/login')
    # Or rely on hydration.

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done Frontend Updates")
