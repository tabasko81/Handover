# Shift Handover Log Web Application

Aplicação web para registo de passagem de turno em operações hoteleiras. Permite ao pessoal documentar e comunicar informações importantes entre turnos num formato estruturado e acessível.

## Características

- ✅ Criar, editar, arquivar e eliminar entradas de log
- ✅ Pesquisa e filtros (por data, trabalhador, palavras-chave)
- ✅ Interface responsiva (desktop, tablet, mobile)
- ✅ Visualização paginada de logs
- ✅ Gestão de logs arquivados
- ✅ Validação de dados no cliente e servidor
- ✅ Sem autenticação necessária (acesso aberto)

## Stack Tecnológica

### Backend
- Node.js com Express.js
- SQLite (pode ser facilmente migrado para MySQL/PostgreSQL)
- API RESTful

### Frontend
- React.js
- Tailwind CSS
- Axios para chamadas API

## Pré-requisitos

- Node.js 14+ e npm
- Git (opcional)

## Instalação

1. **Clone ou baixe o repositório**

```bash
cd Handover
```

2. **Instale as dependências**

```bash
npm run install-all
```

Este comando instala as dependências tanto do backend quanto do frontend.

3. **Configure as variáveis de ambiente**

Crie um ficheiro `.env` na raiz do projeto:

```env
PORT=5000
NODE_ENV=development
```

4. **Inicialize a base de dados**

```bash
npm run setup-db
```

A base de dados SQLite será criada automaticamente em `data/shift_logs.db`.

## Execução

### Modo de Desenvolvimento

Para executar o servidor e o cliente simultaneamente:

```bash
npm run dev
```

Ou execute separadamente:

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

O backend estará disponível em `http://localhost:5000`
O frontend estará disponível em `http://localhost:3000`

### Modo de Produção

1. **Construir o frontend:**
```bash
npm run build
```

2. **Executar o servidor:**
```bash
NODE_ENV=production npm run server
```

## Estrutura do Projeto

```
Handover/
├── server/
│   ├── index.js              # Servidor Express principal
│   ├── database/
│   │   ├── db.js             # Configuração da base de dados
│   │   └── setup.js          # Script de inicialização
│   ├── routes/
│   │   └── logs.js           # Rotas da API
│   └── utils/
│       └── validation.js     # Validação e sanitização
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── services/         # Serviços API
│   │   ├── App.js            # Componente principal
│   │   └── index.js          # Ponto de entrada
│   └── package.json
├── data/                     # Base de dados SQLite (gerado)
└── package.json
```

## API Endpoints

### GET /api/logs
Obtém todas as entradas de log (com paginação e filtros)

**Query Parameters:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Entradas por página (padrão: 20)
- `archived` (opcional): true/false para mostrar arquivados
- `search`: Termo de pesquisa
- `worker_name`: Filtrar por código de trabalhador
- `start_date`: Data de início
- `end_date`: Data de fim

### GET /api/logs/:id
Obtém uma entrada de log específica

### POST /api/logs
Cria uma nova entrada de log

**Body:**
```json
{
  "log_date": "2025-11-01T14:30:00",
  "short_description": "Room issue",
  "note": "Guest in room 305 reported broken AC. Maintenance notified.",
  "worker_name": "ABC"
}
```

### PUT /api/logs/:id
Atualiza uma entrada de log

### PATCH /api/logs/:id/archive
Arquiva ou restaura uma entrada de log

**Body:**
```json
{
  "is_archived": true
}
```

### DELETE /api/logs/:id
Elimina uma entrada de log (soft delete)

### GET /api/logs/search/:query
Pesquisa logs por termo

## Estrutura da Base de Dados

### Tabela: shift_logs

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER | Chave primária |
| log_date | DATETIME | Data e hora do evento |
| short_description | VARCHAR(50) | Descrição curta (2 palavras) |
| note | TEXT | Descrição detalhada (max 1000 chars) |
| worker_name | VARCHAR(3) | Código de 3 letras do trabalhador |
| created_at | TIMESTAMP | Quando foi criado |
| updated_at | TIMESTAMP | Última atualização |
| is_archived | BOOLEAN | Estado de arquivo |
| is_deleted | BOOLEAN | Soft delete flag |

## Funcionalidades

### Criar Log Entry
- Preencha a data/hora (auto-preenchida com data atual)
- Descrição curta (máx. 50 caracteres)
- Nota detalhada (máx. 1000 caracteres)
- Código do trabalhador (3 letras)

### Pesquisar e Filtrar
- Pesquisa em tempo real em todas as descrições e notas
- Filtro por intervalo de datas
- Filtro por código de trabalhador
- Toggle para mostrar/ocultar arquivados

### Editar Log Entry
- Clique em "Edit" em qualquer entrada
- Modifique qualquer campo
- Salve as alterações

### Arquivar Log Entry
- Clique em "Archive" para arquivar
- Clique em "Restore" para restaurar
- Logs arquivados aparecem em cinza

### Eliminar Log Entry
- Clique em "Delete"
- Confirmação necessária
- Soft delete (não remove permanentemente)

## Validação

### Cliente (Frontend)
- Validação em tempo real dos campos
- Contadores de caracteres
- Mensagens de erro visíveis

### Servidor (Backend)
- Validação completa de todos os inputs
- Sanitização para prevenir XSS
- Verificação de limites de caracteres
- Conversão automática para maiúsculas do código do trabalhador

## Segurança

- Sanitização de inputs para prevenir XSS
- Soft delete para preservar dados
- Validação no cliente e servidor
- CORS configurado
- Rate limiting recomendado para produção

## Limitações Atuais

- Sem autenticação de utilizadores
- Sem histórico de edições
- Sem exportação para PDF/Excel
- Sem notificações

## Futuras Melhorias

- Autenticação de utilizadores
- Histórico de alterações
- Exportação de logs
- Notificações por email
- Anexos (fotos, documentos)
- Dashboard com estatísticas
- Suporte multi-idioma

## Troubleshooting

### Erro ao iniciar o servidor
- Verifique se a porta 5000 está disponível
- Verifique se o Node.js está instalado (versão 14+)
- Execute `npm install` novamente

### Erro ao criar base de dados
- Verifique permissões de escrita na pasta `data/`
- Certifique-se de que o diretório `data/` existe

### Frontend não conecta ao backend
- Verifique se o servidor está a correr na porta 5000
- Verifique o ficheiro `.env` e a configuração do proxy no `client/package.json`

## Suporte

Para questões ou problemas, consulte a documentação técnica completa ou contacte a equipa de desenvolvimento.

## Licença

ISC

## Autor

Desenvolvido de acordo com as especificações técnicas fornecidas.

