import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\layout.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the sidebar menu item hover and transition styling
old_active_style = "active\n                                        ? `${item.bgColor} dark:bg-gray-700 ${item.color} dark:text-white font-medium`\n                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'"

new_active_style = "active\n                                        ? `${item.bgColor} dark:bg-gray-700/50 ${item.color} dark:text-white font-semibold shadow-sm border border-${item.color.split('-')[1]}-200/50 dark:border-gray-600`\n                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200 hover:translate-x-1'"
content = content.replace(old_active_style, new_active_style)

# 2. Update top navbar to use backdrop blur (glassmorphism)
old_header = "header className=\"sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700\""
new_header = "header className=\"sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 shadow-sm\""
content = content.replace(old_header, new_header)

# 3. Enhance dropdown user menu UI
old_user_btn = "Button variant=\"ghost\" className=\"flex items-center space-x-2\""
new_user_btn = "Button variant=\"ghost\" className=\"flex items-center space-x-2 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors\""
content = content.replace(old_user_btn, new_user_btn)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
