# Cinema Challenge - Sistema de Reserva de Ingressos

Este projeto é um sistema completo de reserva de ingressos de cinema, desenvolvido como desafio final do estágio. O sistema é composto por duas aplicações principais:

## 📁 Estrutura do Projeto

### `cinema-challenge-back-main/`
API RESTful desenvolvida em **Node.js** com **Express** e **MongoDB**. Responsável por:
- Autenticação e autorização de usuários
- Gerenciamento de filmes, salas e sessões
- Sistema de reservas e assentos
- Documentação automática com Swagger

### `cinema-challenge-front-main/`
Interface web desenvolvida em **React** com **Vite**. Oferece:
- Interface intuitiva para usuários e administradores
- Navegação entre filmes e sessões
- Sistema de seleção de assentos
- Gerenciamento de reservas pessoais

## 🚀 Executando o Projeto

### Pré-requisitos
- **Docker Desktop** instalado e em execução
- **Node.js** (v14+)
- **npm** ou **yarn**

### 1. Configurando o Banco de Dados (MongoDB)

O projeto utiliza MongoDB como banco de dados. Execute o comando abaixo para criar um container MongoDB:

```bash
docker run -d --name cinema-mongodb -p 27017:27017 mongo:7.0
```

Isso irá:
- Baixar a imagem do MongoDB 7.0 (se necessário)
- Criar um container chamado `cinema-mongodb`
- Expor o MongoDB na porta padrão `27017`

### 2. Executando o Backend (API)

```bash
cd cinema-challenge-back-main
npm install
npm run dev
```

A API estará disponível em: `http://localhost:3000`
- Documentação Swagger: `http://localhost:3000/api/v1/docs`

### 3. Executando o Frontend (Interface Web)

```bash
cd cinema-challenge-front-main
npm install
npm run dev
```

A aplicação web estará disponível em: `http://localhost:5173`

### 4. Populando o Banco com Dados de Teste

Para facilitar os testes, execute o script de seed no backend:

```bash
cd cinema-challenge-back-main
npm run seed
```

## 🔧 Comandos Úteis do Docker

```bash
# Verificar se o container está rodando
docker ps

# Parar o container MongoDB
docker stop cinema-mongodb

# Iniciar o container MongoDB (se já existir)
docker start cinema-mongodb

# Remover o container (dados serão perdidos)
docker rm cinema-mongodb
```

## 📝 Arquivos de Configuração

- **Backend**: Arquivo `.env` já configurado para conectar com MongoDB local
- **Frontend**: Configuração automática para consumir API local

## 🎯 Objetivos do Projeto

Este projeto demonstra a implementação de conceitos fundamentais de desenvolvimento web:
- Arquitetura REST API
- Autenticação JWT
- Operações CRUD completas
- Interface responsiva com React
- Containerização com Docker
- Documentação de API

---

**Desenvolvido como projeto final do estágio - aplicando conhecimentos adquiridos em desenvolvimento full-stack.**