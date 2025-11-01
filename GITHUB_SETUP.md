# Como fazer Push para o GitHub

## Passo 1: Criar Repositório no GitHub

1. Aceda a: https://github.com
2. Faça login na sua conta (ou crie uma se não tiver)
3. Clique no botão **"+"** no canto superior direito
4. Selecione **"New repository"**
5. Preencha:
   - **Repository name:** `shift-handover-log` (ou outro nome que prefira)
   - **Description:** "Web application for hotel shift handover logging"
   - Escolha **Public** ou **Private**
   - **NÃO** marque "Initialize with README" (já temos um)
6. Clique em **"Create repository"**

## Passo 2: Adicionar Remote e Fazer Push

Depois de criar o repositório no GitHub, execute estes comandos (substitua `SEU_USUARIO` pelo seu username do GitHub):

### Se o repositório é HTTPS:
```bash
git remote add origin https://github.com/SEU_USUARIO/shift-handover-log.git
git branch -M main
git push -u origin main
```

### Se o repositório é SSH:
```bash
git remote add origin git@github.com:SEU_USUARIO/shift-handover-log.git
git branch -M main
git push -u origin main
```

## Comandos Já Executados

Os seguintes comandos já foram executados:
- ✅ `git init` - Repositório inicializado
- ✅ `git add .` - Ficheiros adicionados
- ✅ `git commit -m "Initial commit"` - Commit inicial criado

## Próximos Passos Após Push

Depois de fazer push, pode:
- Partilhar o link do repositório
- Configurar GitHub Pages (opcional)
- Adicionar colaboradores
- Criar issues e milestones
- Configurar GitHub Actions (CI/CD)

## Estrutura do Repositório

O repositório inclui:
- ✅ Código completo do backend (Node.js/Express)
- ✅ Código completo do frontend (React)
- ✅ Base de dados SQLite (schema apenas)
- ✅ Documentação completa (README.md, QUICKSTART.md)
- ✅ Scripts de instalação para Windows
- ✅ .gitignore configurado

**Nota:** A pasta `data/` e ficheiros `.env` estão no `.gitignore` e não serão enviados (como deve ser, para segurança).

