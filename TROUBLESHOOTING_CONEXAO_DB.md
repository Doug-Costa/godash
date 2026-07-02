# 🛠️ Resolução de Problemas de Conexão com o Banco de Dados Clone (MySQL)

Este documento registra as causas, diagnósticos e soluções aplicadas para resolver falhas de conexão (`ETIMEDOUT`, `ER_HOST_NOT_PRIVILEGED`, `EAI_AGAIN`) entre o container da aplicação `dentalgo-bi` e o banco de dados MariaDB/MySQL clone hospedado no mesmo servidor VPS.

---

## 🔍 Cenário e Arquitetura
* **Aplicação (`dentalgo-bi`)**: Roda dentro de um container Docker na porta `3035` (mapeada para a porta interna `3000`).
* **Banco de Dados Clone (`dentalgo-target-db`)**: Roda em um container Docker MariaDB (`10.11`) na rede virtual `db-clone_default`.
* **Banco do Host (VPS)**: O Ubuntu possui um MySQL nativo instalado na porta `3306` (geralmente vazio ou usado para o phpMyAdmin local).

---

## 🚨 Sintomas e Erros Resolvidos

### 1. Conexão Expirada (`ETIMEDOUT`)
* **Erro nos logs:** `Leads GET error: Error: connect ETIMEDOUT`
* **Causa 1 (SSL):** A aplicação tentava conectar usando SSL (`DB_SSL=true`), mas o clone do banco de dados na VPS não suporta conexões criptografadas.
* **Causa 2 (Firewall da VPS):** O firewall UFW ativo na VPS bloqueava qualquer conexão vinda de redes virtuais do Docker em direção à porta `3306`.
* **Solução:**
  1. No arquivo `.env.local` da VPS, desative o SSL definindo `DB_SSL=false`.
  2. No terminal da VPS, libere a porta `3306` para a sub-rede padrão do Docker (IPs `172.16.0.0/12`):
     ```bash
     sudo ufw allow from 172.16.0.0/12 to any port 3306
     ```

---

### 2. Rede Isolada e Erro de Resolução de DNS (`EAI_AGAIN`)
* **Erro nos logs:** `Leads GET error: Error: getaddrinfo EAI_AGAIN db-target`
* **Causa:** O container da aplicação estava na rede Docker padrão (`godash_default`) e tentava falar com o banco clone (`db-target`), que estava na rede `db-clone_default`. Redes diferentes no Docker não resolvem nomes entre si.
* **Solução:**
  1. Atualize o arquivo `docker-compose.yml` do painel para conectar o container à rede externa do banco clone:
     ```yaml
     services:
       dentalgo-bi:
         # ... outras configurações ...
         networks:
           - db-clone_default

     networks:
       db-clone_default:
         external: true
     ```
  2. No `.env.local` da VPS, altere o host para o alias correto do container de banco de dados na rede:
     ```ini
     DB_HOST=db-target
     ```
  3. Force a recriação do container com a nova rede:
     ```bash
     docker compose down
     docker compose up -d --build
     ```

---

### 3. Acesso Negado / Host Não Autorizado (`ER_HOST_NOT_PRIVILEGED`)
* **Erro nos logs:** `Leads GET error: Error: Host '172.30.0.2' is not allowed to connect to this MySQL server` (erro 1130)
* **Causa:** O usuário `xkey` no MariaDB estava configurado para aceitar conexões apenas de `localhost` ou `127.0.0.1`. Ao tentar conectar de dentro do container Docker, a conexão vinha com um IP da rede Docker (ex: `172.29.0.2` ou `172.30.0.2`), que o MariaDB rejeitava por segurança.
* **Solução:** 
  É necessário dar permissões de acesso ao usuário para a origem do Docker.
  > ⚠️ **Atenção:** As permissões devem ser aplicadas **dentro do container** do banco de dados clone (`dentalgo-target-db`), e não no MySQL nativo da VPS host.

  1. Acesse o console SQL dentro do container do banco:
     ```bash
     docker exec -it dentalgo-target-db mariadb -u root -p
     # (ou mysql caso não possua o comando mariadb)
     ```
  2. Execute os comandos SQL abaixo para liberar acesso de qualquer host (`%`) para o banco de BI (seguro porque a porta é protegida pelo firewall UFW da VPS):
     ```sql
     -- Cria/atualiza o usuário para aceitar conexões de qualquer host
     CREATE USER IF NOT EXISTS 'xkey'@'%' IDENTIFIED BY 'xkey@2026*';

     -- Concede acesso de leitura (SELECT) à base de dados do clone
     GRANT SELECT ON dentalgo_production.* TO 'xkey'@'%';

     -- Aplica as alterações
     FLUSH PRIVILEGES;

     -- Sair do terminal SQL
     EXIT;
     ```

---

## 🛠️ Comandos Úteis de Diagnóstico (na VPS)

* **Verificar portas e escutas no host:**
  ```bash
  netstat -tlpn | grep 3306
  # ou
  ss -tlpn | grep 3306
  ```
  *(Deve mostrar `0.0.0.0:3306` indicando que o MySQL aceita conexões externas/Docker, e não apenas `127.0.0.1:3306`).*

* **Testar conectividade TCP de dentro do container da aplicação para o banco:**
  ```bash
  docker exec -it dentalgo-bi nc -zv db-target 3306
  ```
  *(Retorno esperado: `db-target (172.29.0.2:3306) open` ou `succeeded`).*

* **Verificar a rede dos containers:**
  ```bash
  docker inspect dentalgo-bi | grep -A 15 "Networks"
  docker inspect dentalgo-target-db | grep -A 15 "Networks"
  ```
  *(Ambos os containers devem listar a mesma rede: `db-clone_default`).*

* **Acompanhar os logs em tempo real:**
  ```bash
  docker logs -f --tail 50 dentalgo-bi
  ```
