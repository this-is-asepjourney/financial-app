import re

file_path_auth = r'd:\repository\financial-app\src\lib\auth.ts'
with open(file_path_auth, 'r', encoding='utf-8') as f:
    content = f.read()

# Add paydayDate to authorization
old_auth = """          monthlyIncome: user.monthlyIncome,
          currency: user.currency,
        }"""
new_auth = """          monthlyIncome: user.monthlyIncome,
          currency: user.currency,
          paydayDate: user.paydayDate,
        }"""
content = content.replace(old_auth, new_auth)

# Add paydayDate to jwt
old_jwt = """        token.id = user.id
        token.monthlyIncome = user.monthlyIncome
        token.currency = user.currency
      }
      if (trigger === "update" && session?.user) {
        token.name = session.user.name
        token.monthlyIncome = session.user.monthlyIncome
        token.currency = session.user.currency"""
new_jwt = """        token.id = user.id
        token.monthlyIncome = user.monthlyIncome
        token.currency = user.currency
        token.paydayDate = user.paydayDate
      }
      if (trigger === "update" && session?.user) {
        token.name = session.user.name
        token.monthlyIncome = session.user.monthlyIncome
        token.currency = session.user.currency
        token.paydayDate = session.user.paydayDate"""
content = content.replace(old_jwt, new_jwt)

# Add paydayDate to session
old_session = """        session.user.id = token.id as string
        session.user.monthlyIncome = token.monthlyIncome as number | null
        session.user.currency = token.currency as string | null"""
new_session = """        session.user.id = token.id as string
        session.user.monthlyIncome = token.monthlyIncome as number | null
        session.user.currency = token.currency as string | null
        session.user.paydayDate = token.paydayDate as number | null"""
content = content.replace(old_session, new_session)

with open(file_path_auth, 'w', encoding='utf-8') as f:
    f.write(content)
