# Quick Start - Docker (Docker já instalado)

Guia rápido para executar a aplicação Shift Handover Log com Docker quando o Docker já está instalado.

## 🚀 Execução Rápida

### 1. Navegar para o diretório do projeto

```bash
cd /caminho/para/Handover
```

### 2. Executar o script

```bash
chmod +x run-docker.sh
./run-docker.sh
```

Pronto! A aplicação estará disponível em:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## ⚙️ Configuração de Portas

Para alterar as portas, defina variáveis de ambiente antes de executar:

```bash
export BACKEND_PORT=5001
export FRONTEND_PORT=3001
export DOMAIN=seu-ip-ou-dominio
./run-docker.sh
```

Ou edite diretamente o `docker-compose.yml` após a primeira execução.

## 🛠️ Comandos Úteis

```bash
# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend
docker compose logs -f frontend

# Parar aplicação
docker compose down

# Reiniciar aplicação
docker compose restart

# Ver estado dos containers
docker compose ps

# Reconstruir imagens
docker compose build --no-cache
docker compose up -d
```

## 📝 O que o script faz

1. ✅ Verifica se o Docker está a correr
2. ✅ Cria `docker-compose.yml` se não existir
3. ✅ Cria diretórios `data/` e `logs/` se necessário
4. ✅ Cria ficheiro `.env` com configurações padrão
5. ✅ Constrói as imagens Docker
6. ✅ Inicia os containers

## 🔑 Credenciais Padrão

- **Username**: `admin`
- **Password**: `pass123`

⚠️ **IMPORTANTE**: Altere a password imediatamente após o primeiro login!

## 🐛 Resolução de Problemas

### Porta já em uso

Altere as portas antes de executar:

```bash
export BACKEND_PORT=5001
export FRONTEND_PORT=3001
./run-docker.sh
```

### Reconstruir tudo

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Ver erros

```bash
docker compose logs
```

### Limpar tudo e recomeçar

```bash
docker compose down -v
rm -rf data/*.db logs/*
./run-docker.sh
```

## 📁 Estrutura Criada

O script cria automaticamente:

```
.
├── docker-compose.yml   # Configuração Docker (criado automaticamente)
├── .env                 # Variáveis de ambiente (criado automaticamente)
├── data/                # Base de dados SQLite
└── logs/                # Ficheiros de log
```

