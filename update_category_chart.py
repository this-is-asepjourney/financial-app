import re

file_path = r'd:\repository\financial-app\src\components\charts\CategoryBreakdown.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the label prop from Pie and adjust layout
old_pie = """                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                        `${name || 'Unknown'} (${((percent || 0) * 100).toFixed(1)}%)`
                    }
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="totalAmount"
                    nameKey="categoryName"
                >"""

new_pie = """                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={110}
                    innerRadius={60}
                    paddingAngle={2}
                    fill="#8884d8"
                    dataKey="totalAmount"
                    nameKey="categoryName"
                >"""
content = content.replace(old_pie, new_pie)

# Adjust height of responsive container to give legend some room
content = content.replace('<ResponsiveContainer width="100%" height={400}>', '<ResponsiveContainer width="100%" height={320}>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
