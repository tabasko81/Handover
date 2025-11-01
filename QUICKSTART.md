# Início Rápido - Shift Handover Log

## Instalação Rápida

1. **Instalar dependências:**
```bash
npm run install-all
```

2. **Configurar base de dados:**
```bash
npm run setup-db
```

3. **Adicionar dados de exemplo (opcional):**
```bash
npm run seed
```

4. **Iniciar aplicação:**
```bash
npm run dev
```

## Acesso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## Primeiros Passos

1. Abra o browser em `http://localhost:3000`
2. Clique em "Create New Log"
3. Preencha o formulário:
   - Data será preenchida automaticamente
   - Descrição curta (máx. 50 caracteres)
   - Nota detalhada (máx. 1000 caracteres)
   - Código do trabalhador (3 letras, ex: "ABC")
4. Clique em "Save"

## Funcionalidades Principais

- ✅ **Criar Log:** Botão "Create New Log"
- ✅ **Editar:** Clique em "Edit" em qualquer entrada
- ✅ **Arquivar:** Clique em "Archive" (aparece em cinza)
- ✅ **Eliminar:** Clique em "Delete" (confirmação necessária)
- ✅ **Pesquisar:** Use a barra de pesquisa no topo
- ✅ **Filtrar:** Use os filtros por data, trabalhador, etc.

## Estrutura de Ficheiros

```
Handover/
├── server/          # Backend Node.js/Express
├── client/          # Frontend React
├── data/            # Base de dados SQLite (criado automaticamente)
└── README.md        # Documentação completa
```

## Problemas Comuns

### Porta já em uso
Se a porta 5000 estiver ocupada, altere no ficheiro `.env`:
```
PORT=5001
```

### Erro ao instalar dependências
- Certifique-se de ter Node.js 14+ instalado
- Tente `npm cache clean --force` e depois `npm install`

### Frontend não carrega
- Verifique se o servidor está a correr (porta 5000)
- Verifique os logs do terminal para erros

## Suporte

Consulte o `README.md` para documentação completa.

