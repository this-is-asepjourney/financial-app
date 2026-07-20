import re

file_path = r'd:\repository\financial-app\prisma\schema.prisma'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add IncomeSource[] to User
old_user = """  notifications     Notification[]
}"""
new_user = """  notifications     Notification[]
  incomeSources     IncomeSource[]
}"""
content = content.replace(old_user, new_user)

# Add IncomeSource model at the end
new_model = """

model IncomeSource {
  id        String   @id @default(uuid())
  userId    String
  name      String   
  amount    Float
  frequency String   // "daily", "weekly", "monthly", "yearly", "irregular"
  type      String   // "active", "passive"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}
"""
content += new_model

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
