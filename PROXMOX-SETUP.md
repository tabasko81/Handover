# Instalação Automática no Proxmox LXC

Guia simples para instalar a aplicação Shift Handover Log num container LXC no Proxmox de forma totalmente automática.

## 🚀 Instalação Rápida

### Passo 1: Aceder ao Shell do Proxmox

1. Abra a interface web do Proxmox
2. Clique em **"Shell"** no canto superior direito (ou aceda via SSH)
3. Certifique-se de que está no **host Proxmox** (não dentro de um container)

### Passo 2: Executar Script de Instalação

Cole este comando no shell do Proxmox:

```bash
curl -sSL https://raw.githubusercontent.com/tabasko81/Handover/main/install-proxmox.sh | bash
```

**Alternativas se o URL acima não funcionar:**

**Opção 1: Usar commit SHA específico (mais confiável)**
```bash
curl -sSL https://raw.githubusercontent.com/tabasko81/Handover/bb930b099366bd7b07a671a4494b1ee1b65618ae/install-proxmox.sh | bash
```

**Opção 2: Usar wget**
```bash
wget -qO- https://raw.githubusercontent.com/tabasko81/Handover/main/install-proxmox.sh | bash
```

**Opção 3: Download manual e execução**
```bash
# Baixar o ficheiro
wget https://raw.githubusercontent.com/tabasko81/Handover/main/install-proxmox.sh

# Tornar executável
chmod +x install-proxmox.sh

# Executar
bash install-proxmox.sh
```

### Passo 3: Aguardar Instalação

O script irá automaticamente:

1. ✅ Detectar storage local disponível (exclui USB)
2. ✅ Encontrar próximo ID de container disponível
3. ✅ Criar container LXC com Debian
4. ✅ Instalar Docker dentro do container
5. ✅ Fazer clone do repositório Git
6. ✅ Instalar e iniciar a aplicação
7. ✅ Mostrar informações de acesso

**Tempo estimado:** 5-10 minutos (dependendo da velocidade de download)

### Passo 4: Aceder à Aplicação

Após a instalação, o script mostrará:

- **IP do container** (ex: `192.168.1.100`)
- **URL do Frontend:** `http://<IP>:3000`
- **URL do Backend:** `http://<IP>:5000/api`

**Credenciais padrão:**
- Username: `admin`
- Password: `pass123`

⚠️ **IMPORTANTE:** Altere a password imediatamente após o primeiro login!

---

## 📋 Pré-requisitos

- Proxmox VE instalado e configurado
- Acesso root ao host Proxmox
- Pelo menos 2GB de RAM disponível
- Pelo menos 8GB de espaço em disco local (não USB)
- Conectividade de rede (para download de templates e Git)

---

## ⚙️ Configurações Padrão

O script usa as seguintes configurações padrão:

- **Template:** Debian (mais recente disponível)
- **Hostname:** `handover-log`
- **RAM:** 2048 MB
- **CPU:** 2 cores
- **Disco:** 8 GB
- **Rede:** DHCP (bridge vmbr0)
- **Backend Port:** 5000
- **Frontend Port:** 3000

Estas configurações podem ser alteradas editando o script `install-proxmox.sh` antes de executar.

---

## 🔧 Gestão do Container

### Entrar no Container

```bash
pct enter <ID_DO_CONTAINER>
```

### Ver Logs da Aplicação

```bash
pct exec <ID_DO_CONTAINER> -- bash -c 'cd /opt/shift-handover-log && docker compose logs -f'
```

### Parar Aplicação

```bash
pct exec <ID_DO_CONTAINER> -- bash -c 'cd /opt/shift-handover-log && docker compose down'
```

### Iniciar Aplicação

```bash
pct exec <ID_DO_CONTAINER> -- bash -c 'cd /opt/shift-handover-log && docker compose up -d'
```

### Ver Estado

```bash
pct exec <ID_DO_CONTAINER> -- bash -c 'cd /opt/shift-handover-log && docker compose ps'
```

### Reiniciar Container

```bash
pct restart <ID_DO_CONTAINER>
```

### Parar Container

```bash
pct stop <ID_DO_CONTAINER>
```

### Iniciar Container

```bash
pct start <ID_DO_CONTAINER>
```

---

## 🐛 Resolução de Problemas

### Erro: "Storage local não encontrado"

**Solução:**
- Verifique se tem storage local configurado no Proxmox
- O script exclui automaticamente storages USB
- Configure um storage local (local-lvm ou local) no Proxmox

### Erro: "Template Debian não encontrado"

**Solução:**
- O script tenta baixar automaticamente o template
- Verifique conectividade de rede
- Pode baixar manualmente: `pveam update && pveam download local debian-XX-standard`

### Container não inicia

**Solução:**
```bash
# Ver logs do container
pct status <ID> --verbose

# Verificar configuração
pct config <ID>
```

### Aplicação não responde

**Solução:**
```bash
# Entrar no container
pct enter <ID>

# Verificar se Docker está a correr
systemctl status docker

# Ver logs da aplicação
cd /opt/shift-handover-log
docker compose logs
```

### IP não detectado

**Solução:**
```bash
# Descobrir IP manualmente
pct exec <ID> -- hostname -I

# Ou verificar configuração de rede
pct config <ID> | grep ip
```

---

## 📊 Verificar Recursos

### Ver Utilização de Recursos do Container

```bash
pct enter <ID>
htop
# ou
free -h
df -h
```

### Ver Utilização de Recursos dos Containers Docker

```bash
pct exec <ID> -- docker stats
```

---

## 🔄 Atualizar Aplicação

Para atualizar a aplicação para a versão mais recente:

```bash
# Entrar no container
pct enter <ID>

# Ir para diretório da aplicação
cd /opt/shift-handover-log

# Fazer backup
docker compose down
cp -r data data.backup.$(date +%Y%m%d)

# Atualizar código
git pull

# Reconstruir e reiniciar
docker compose build --no-cache
docker compose up -d
```

---

## 💾 Backup

### Criar Backup Manual

```bash
# Parar aplicação
pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose down'

# Fazer backup do diretório data
pct exec <ID> -- tar -czf /tmp/backup-$(date +%Y%m%d).tar.gz -C /opt/shift-handover-log data

# Copiar backup para host
pct pull <ID> /tmp/backup-*.tar.gz /root/backups/

# Reiniciar aplicação
pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose up -d'
```

### Restaurar Backup

```bash
# Parar aplicação
pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose down'

# Copiar backup para container
pct push <ID> /root/backups/backup-YYYYMMDD.tar.gz /tmp/

# Extrair backup
pct exec <ID> -- tar -xzf /tmp/backup-YYYYMMDD.tar.gz -C /opt/shift-handover-log

# Reiniciar aplicação
pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose up -d'
```

---

## 📝 Notas Importantes

1. **Storage Local:** O script instala sempre no disco local, nunca em USB
2. **ID Automático:** O script encontra automaticamente o próximo ID disponível (100, 101, 102...)
3. **IP Automático:** O IP é atribuído via DHCP e detectado automaticamente
4. **Modo Não-Interativo:** O script executa tudo automaticamente sem pedir confirmações (exceto confirmação inicial)
5. **Templates:** O script baixa automaticamente o template Debian se não estiver disponível

---

## 🔒 Segurança

- ⚠️ Altere a password padrão imediatamente após instalação
- ⚠️ Configure firewall se necessário
- ⚠️ Considere usar HTTPS em produção (reverse proxy)
- ⚠️ Faça backups regulares dos dados

---

## 📞 Suporte

Para problemas ou questões:

1. Verifique os logs: `pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose logs'`
2. Consulte a documentação em `docs/`
3. Verifique o estado: `pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose ps'`

---

**Versão:** Alpha v0.25.11-alpha.6  
**Última atualização:** 2025

