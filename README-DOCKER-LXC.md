# Shift Handover Log - Instalação Docker em LXC/Proxmox

Guia completo para instalar a aplicação Shift Handover Log num container LXC no Proxmox usando Docker.

## 📋 Pré-requisitos

- Container LXC no Proxmox (Debian/Ubuntu recomendado)
- Acesso root ao container
- Pelo menos 2GB de RAM disponível
- Pelo menos 5GB de espaço em disco

## 🚀 Instalação Rápida

### 1. Preparar o Container LXC

No Proxmox, crie ou configure um container LXC:

```bash
# No host Proxmox, criar container LXC
pct create 100 local:vztmpl/debian-11-standard_11.7-1_amd64.tar.zst \
  --hostname handover-log \
  --memory 2048 \
  --cores 2 \
  --storage local-lvm \
  --rootfs local-lvm:8 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp
```

### 2. Aceder ao Container

```bash
# No host Proxmox
pct enter 100

# Ou via SSH se configurado
ssh root@<ip-do-container>
```

### 3. Transferir Ficheiros

Copie os ficheiros da aplicação para o container:

```bash
# Opção 1: Via SCP (do seu computador)
scp -r /caminho/para/Handover root@<ip-container>:/root/

# Opção 2: Via Git (se o projeto estiver no GitHub)
apt-get update
apt-get install -y git
git clone <url-do-repositorio> /opt/shift-handover-log
```

### 4. Executar Script de Instalação

```bash
cd /root/Handover  # ou /opt/shift-handover-log se usou git
chmod +x install-docker-lxc.sh
./install-docker-lxc.sh
```

O script irá:
- ✅ Verificar e instalar Docker se necessário
- ✅ Instalar Docker Compose
- ✅ Configurar a aplicação
- ✅ Construir imagens Docker
- ✅ Iniciar os containers

## ⚙️ Configuração

### Variáveis de Ambiente

Durante a instalação, o script pedirá:
- **Backend Port**: Porta para o backend (padrão: 5000)
- **Frontend Port**: Porta para o frontend (padrão: 3000)
- **Domain**: Domínio ou IP do servidor

### Configuração Manual

Edite o ficheiro `.env` em `/opt/shift-handover-log/`:

```bash
nano /opt/shift-handover-log/.env
```

Variáveis disponíveis:
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=seu-secret-aqui
FRONTEND_URL=http://seu-dominio:3000
REACT_APP_API_URL=http://seu-dominio:5000/api
DOMAIN=seu-dominio
BACKEND_PORT=5000
FRONTEND_PORT=3000
```

## 🛠️ Gestão da Aplicação

Use o script de gestão `docker-manage.sh`:

```bash
# Tornar executável (se necessário)
chmod +x docker-manage.sh

# Iniciar containers
./docker-manage.sh start

# Parar containers
./docker-manage.sh stop

# Reiniciar containers
./docker-manage.sh restart

# Ver estado
./docker-manage.sh status

# Ver logs
./docker-manage.sh logs              # Todos os serviços
./docker-manage.sh logs backend      # Apenas backend
./docker-manage.sh logs frontend     # Apenas frontend

# Reconstruir imagens
./docker-manage.sh rebuild

# Criar backup
./docker-manage.sh backup

# Atualizar aplicação
./docker-manage.sh update
```

## 🌐 Acesso à Aplicação

Após a instalação, a aplicação estará disponível em:

- **Frontend**: `http://<ip-do-container>:3000`
- **Backend API**: `http://<ip-do-container>:5000/api`
- **Health Check**: `http://<ip-do-container>:5000/api/health`

### Credenciais Padrão

- **Username**: `admin`
- **Password**: `pass123`

⚠️ **IMPORTANTE**: Altere a password imediatamente após o primeiro login!

## 🔧 Configuração de Rede no Proxmox

### Port Forwarding

Se precisar de aceder de fora da rede local, configure port forwarding no Proxmox:

1. No host Proxmox, edite `/etc/pve/lxc/<id>.conf`:

```
lxc.net.0.type = veth
lxc.net.0.link = vmbr0
lxc.net.0.flags = up
lxc.net.0.ipv4.address = 10.0.0.100/24
lxc.net.0.ipv4.gateway = 10.0.0.1
```

2. Configure port forwarding no router/firewall do Proxmox

### Firewall

Se usar firewall no Proxmox, permita as portas:

```bash
# No host Proxmox
pct set <id> -net0 name=eth0,bridge=vmbr0,firewall=1
```

## 📊 Monitorização

### Ver Logs em Tempo Real

```bash
docker compose -f /opt/shift-handover-log/docker-compose.yml logs -f
```

### Verificar Estado dos Containers

```bash
docker compose -f /opt/shift-handover-log/docker-compose.yml ps
```

### Verificar Utilização de Recursos

```bash
docker stats
```

## 🔄 Atualização

### Atualizar Aplicação

```bash
cd /opt/shift-handover-log
./docker-manage.sh update
```

Ou manualmente:

```bash
cd /opt/shift-handover-log
./docker-manage.sh backup
git pull  # Se usar git
docker compose build --no-cache
docker compose up -d
```

## 💾 Backup e Restauro

### Criar Backup

```bash
./docker-manage.sh backup
```

O backup será guardado em `/opt/shift-handover-log/backups/`

### Restaurar Backup

```bash
# Parar containers
./docker-manage.sh stop

# Extrair backup
tar -xzf backups/backup_YYYYMMDD_HHMMSS.tar.gz -C /opt/shift-handover-log/

# Reiniciar containers
./docker-manage.sh start
```

## 🐛 Resolução de Problemas

### Containers não iniciam

```bash
# Ver logs detalhados
docker compose -f /opt/shift-handover-log/docker-compose.yml logs

# Verificar estado
docker compose -f /opt/shift-handover-log/docker-compose.yml ps
```

### Porta já em uso

Altere as portas no `docker-compose.yml`:

```yaml
ports:
  - "5001:5000"  # Backend na porta 5001
  - "3001:80"    # Frontend na porta 3001
```

### Problemas de permissões

```bash
# Corrigir permissões dos diretórios
chown -R 1000:1000 /opt/shift-handover-log/data
chown -R 1000:1000 /opt/shift-handover-log/logs
```

### Reconstruir tudo do zero

```bash
cd /opt/shift-handover-log
./docker-manage.sh stop
docker compose down -v
rm -rf data/*.db logs/*
docker compose build --no-cache
docker compose up -d
```

## 📁 Estrutura de Diretórios

```
/opt/shift-handover-log/
├── client/              # Código fonte do frontend
├── server/              # Código fonte do backend
├── data/                # Base de dados SQLite
├── logs/                # Ficheiros de log
├── backups/             # Backups automáticos
├── docker-compose.yml   # Configuração Docker Compose
├── Dockerfile.backend   # Dockerfile do backend
├── Dockerfile.frontend  # Dockerfile do frontend
├── .env                 # Variáveis de ambiente
└── nginx.conf           # Configuração Nginx
```

## 🔒 Segurança

### Recomendações

1. **Altere a password padrão** imediatamente
2. **Configure JWT_SECRET** forte no `.env`
3. **Use HTTPS** em produção (configure reverse proxy)
4. **Mantenha o sistema atualizado**: `apt-get update && apt-get upgrade`
5. **Configure firewall** para limitar acesso
6. **Faça backups regulares**

### Configurar HTTPS com Nginx Reverse Proxy

No host Proxmox ou num container separado, configure Nginx:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://<ip-container>:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://<ip-container>:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📞 Suporte

Para problemas ou questões:
1. Verifique os logs: `./docker-manage.sh logs`
2. Consulte a documentação em `docs/`
3. Verifique o estado: `./docker-manage.sh status`

## 📝 Notas

- O script de instalação foi testado em Debian 11/12 em containers LXC
- Requer pelo menos 2GB de RAM para funcionar adequadamente
- A primeira inicialização pode demorar alguns minutos (build das imagens)
- Os dados são persistidos em `/opt/shift-handover-log/data/`

