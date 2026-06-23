# 🚀 Guia de Implantação (Deployment) - DentalGO CRM v2.0

Este documento descreve as etapas necessárias para implantar o DentalGO CRM v2.0 em ambiente de produção (VPS, máquina local ou servidor dedicado).

---

## 📋 Pré-requisitos

1. **Node.js** (v18.x ou superior) & **NPM** instalados no servidor.
2. **Docker & Docker Compose** (caso opte pela implantação em container).
3. **Banco de Dados Core (MySQL)**: Ter os dados de acesso da instância gerenciada (ex: DigitalOcean).
4. **Variáveis de Ambiente**: Arquivo `.env.local` configurado.

---

## 📂 Estrutura de Banco de Dados Separada (Dual-DB)
*   **Banco 1 (MySQL)**: Conexão externa em modo leitura para obter dados de cadastro dos clientes no DentalGO.
*   **Banco 2 (SQLite)**: Arquivo local no servidor (`dev.db`) usado para persistir os estados do funil, anotações e contas de agentes comerciais.

---

## 🐋 Opção A: Implantação com Docker (Recomendado)

Esta opção usa o `Dockerfile` otimizado (Standalone Next.js) e o `docker-compose.yml` para rodar a aplicação em um container seguro com volume persistente para o SQLite.

### Passo 1: Preparar os arquivos no servidor (Método Rápido com ZIP)

Para evitar extrema lentidão ao transferir milhares de arquivos individuais (nunca transfira as pastas `node_modules` ou `.next`), o ideal é gerar um arquivo compactado (ZIP) do projeto em sua máquina local, enviá-lo ao servidor e extraí-lo lá.

#### Gerar o ZIP localmente (Windows):
* **Opção 1 (Recomendado - Via Git)**: Se todas as suas alterações estão commitadas, gere o zip apenas com os arquivos monitorados pelo Git (ignora automaticamente pastas pesadas):
  ```bash
  git archive --format=zip HEAD -o project.zip
  ```
* **Opção 2 (Via PowerShell)**: Se você tiver arquivos não commitados ou novas alterações locais que deseja enviar, use o PowerShell para gerar o zip excluindo as pastas pesadas:
  ```powershell
  Get-ChildItem -Path . -Exclude "node_modules", ".next", ".git", "prisma_data", "*.zip" | Compress-Archive -DestinationPath project.zip -Force
  ```

#### Enviar e Extrair no Servidor Linux:
1. Transfira o arquivo `project.zip` gerado para o servidor (via SCP, SFTP, FileZilla ou outra ferramenta de sua preferência).
2. Conecte-se ao servidor via SSH e extraia o arquivo no diretório de destino:
   ```bash
   # Instala o unzip caso não possua no servidor (Debian/Ubuntu)
   sudo apt update && sudo apt install unzip -y
   
   # Descompacta o arquivo no diretório do projeto
   unzip project.zip -d /root/godash
   ```

### Passo 2: Configurar variáveis de ambiente
Crie o arquivo `.env.local` na raiz do projeto baseado no `.env.example`:
```bash
cp .env.example .env.local
```
Edite o arquivo preenchendo as chaves:
*   `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_SSL=true` (dados do MySQL no DigitalOcean).
*   `DATABASE_URL="file:/app/prisma_data/dev.db"` (caminho absoluto do SQLite dentro do container para salvar no volume).
*   `NEXTAUTH_SECRET` & `AUTH_SECRET` (chaves de criptografia aleatórias).
*   `NEXTAUTH_URL="https://seu-dominio.com"` (URL de acesso à aplicação).

### Passo 3: Executar o script de deploy
O script `deploy.sh` irá baixar as últimas atualizações do Git, desligar containers antigos e reconstruir a imagem do zero:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Passo 4: Sincronizar o Banco de Dados SQLite (Primeiro Deploy)
Após iniciar o container, rode a sincronização do Prisma para criar o banco de dados `dev.db` com as tabelas de segurança e CRM:
```bash
docker exec -it dentalgo-bi npx prisma db push
```
> 💡 **Nota**: O primeiro usuário Administrador (`admin@dentalgo.com` / `admin123`) é criado automaticamente no primeiro acesso assim que você tentar realizar o login.

---

## ⚙️ Opção B: Implantação Direta na VPS (com PM2)

Caso prefira rodar a aplicação diretamente no sistema operacional da máquina usando o gerenciador de processos **PM2**.

### Passo 1: Instalar dependências globais
Se o PM2 ainda não estiver instalado:
```bash
npm install -g pm2
```

### Passo 2: Instalar as dependências do projeto
```bash
npm install
```

### Passo 3: Configurar o arquivo `.env.local`
Siga os mesmos passos da Opção A, configurando o caminho do SQLite como local:
```env
DATABASE_URL="file:./prisma_data/dev.db"
```

### Passo 4: Inicializar o banco de dados local
```bash
npx prisma db push
```

### Passo 5: Construir o projeto para produção
```bash
npm run build
```

### Passo 6: Iniciar o processo no PM2
```bash
pm2 start npm --name "dentalgo-crm" -- run start
pm2 save
pm2 startup
```

---

## 🌐 Configuração do Proxy Reverso (Nginx)

Para apontar seu domínio (ex: `crm.dentalgo.com`) para a porta da aplicação (padrão `3035` no Docker ou `3000` na VPS), adicione esta configuração ao Nginx:

```nginx
server {
    listen 80;
    server_name crm.dentalgo.com;

    location / {
        proxy_pass http://localhost:3035; # Altere para 3000 se usar PM2
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded-for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Não esqueça de habilitar o SSL (HTTPS) usando o Certbot:
```bash
sudo certbot --nginx -d crm.dentalgo.com
```

---

## 🔄 Backups da Carteira do CRM (SQLite)
Como toda a inteligência do CRM, histórico de contatos e agentes comerciais estão no arquivo SQLite, faça backups regulares do arquivo local:
*   **Se Docker**: O arquivo fica no diretório `./prisma_data/dev.db` da pasta do projeto no host.
*   **Se PM2**: O arquivo fica no diretório `./prisma_data/dev.db` do projeto.

Basta fazer uma cópia de segurança diária desse arquivo para evitar perda de dados da campanha comercial.
