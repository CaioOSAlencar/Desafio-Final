# Cinema Challenge - Sistema de Reserva de Ingressos

Este projeto é um sistema de reserva de ingressos de cinema desenvolvido como desafio final do estágio. O sistema está em **desenvolvimento ativo** com duas aplicações principais e um sistema abrangente de testes automatizados.

## ⚠️ Status do Projeto

**🔴 EM DESENVOLVIMENTO - NÃO PRONTO PARA PRODUÇÃO**

Este projeto passou por uma **análise técnica completa** através de testes de integração automatizados que identificaram:
- **32 bugs** em 6 módulos principais
- **Taxa de funcionalidade**: ~45% do sistema operacional
- **Módulos críticos** necessitam correção antes do deploy

📊 **Status por Módulo:**
- ✅ **Teatros**: 97.2% funcional (excelente)
- 🟡 **Filmes**: ~75% funcional (bom)
- 🟡 **Autenticação**: ~60% funcional (médio)
- 🔴 **Sessões**: 21.6% funcional (crítico)
- 🔴 **Reservas**: ~15% funcional (crítico)
- 🔴 **Usuários**: 0% funcional (inoperante)

> 📋 **Documentação Completa**: Veja `/documentação/documentação de bugs/` para análise técnica detalhada

## 📁 Estrutura do Projeto

### `cinema-challenge-back-main/`
API RESTful em **Node.js** com **Express** e **MongoDB**. Funcionalidades planejadas:
- ✅ Gerenciamento de teatros/salas (funcional)
- 🟡 Autenticação e autorização (parcial)
- 🟡 Gerenciamento de filmes (funcional para consulta)
- 🔴 Sistema de sessões (em desenvolvimento)
- 🔴 Sistema de reservas (em desenvolvimento)
- 🔴 Gerenciamento de usuários (em desenvolvimento)
- 📝 Documentação Swagger (configurada)

### `cinema-challenge-front-main/`
Interface web em **React** com **Vite**. Oferece:
- Interface base para usuários e administradores
- Navegação entre filmes (limitada)
- Sistema de seleção de assentos (pendente backend)
- Gerenciamento de reservas (pendente backend)

### `tests/integration/`
Sistema completo de testes automatizados:
- **258 casos de teste** cobrindo todos os módulos
- **Helpers especializados** para cada funcionalidade
- **Documentação automática de bugs**
- **Relatórios executivos** por módulo

## 🚀 Executando o Projeto

### Pré-requisitos
- **Docker Desktop** instalado e em execução
- **Node.js** (v16+)
- **npm** ou **yarn**

### ⚠️ Limitações Conhecidas
Antes de executar, esteja ciente das limitações atuais:
- **Sistema de reservas**: Não funcional (rotas não implementadas)
- **Gerenciamento de usuários**: Inacessível (404 em todas as rotas)
- **Autenticação admin**: Inconsistente entre módulos
- **Sistema de sessões**: Parcialmente implementado

Para lista completa, consulte: `/documentação/documentação de bugs/RELATORIO-CONSOLIDADO-FINAL.md`

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

### 5. Executando Testes de Integração

Para executar a análise completa do sistema:

```bash
cd cinema-challenge-back-main

# Executar todos os testes de integração
npm run test:integration

# Executar testes de um módulo específico
npm test -- --testPathPattern=movieRoutes.test.js
npm test -- --testPathPattern=theaterRoutes.test.js
npm test -- --testPathPattern=authRoutes.test.js

# Executar com verbose para debug
npm test -- --testPathPattern=userRoutes.test.js --verbose
```

**Resultados Esperados:**
- ✅ Teatros: ~97% dos testes passam
- 🟡 Filmes: ~75% dos testes passam  
- 🟡 Autenticação: ~60% dos testes passam
- 🔴 Outros módulos: <25% dos testes passam

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

## 📋 Estrutura da Documentação

```
documentação/
├── documentação de bugs/
│   ├── 1. Autenticacao/          # 6 bugs identificados
│   ├── 2. Filmes/                # 6 bugs identificados
│   ├── 3. Reservas/              # 5 bugs identificados
│   ├── 4. Sessoes/               # 5 bugs identificados
│   ├── 5. Teatros/               # 5 bugs identificados
│   ├── 6. Usuarios/              # 5 bugs identificados
│   └── RELATORIO-CONSOLIDADO-FINAL.md
└── Plano de teste/               # Estratégia de testes
```

## 🔧 Desenvolvimento e Contribuição

### Roadmap de Correções
1. **🔥 Urgente**: Corrigir registro de rotas (Usuários, Reservas, Sessões)
2. **⚡ Crítico**: Estabilizar sistema de autenticação
3. **📅 Importante**: Implementar validações e lógica de negócio
4. **🎯 Melhoria**: Otimizar módulos funcionais

### Para Desenvolvedores
```bash
# Setup completo de desenvolvimento
git clone <repository>
cd Desafio
docker run -d --name cinema-mongodb -p 27017:27017 mongo:7.0

# Backend
cd cinema-challenge-back-main
npm install
npm run dev

# Frontend (em outro terminal)
cd cinema-challenge-front-main  
npm install
npm run dev

# Executar análise completa
cd cinema-challenge-back-main
npm run test:integration
```

## 🎯 Objetivos e Aprendizados

Este projeto demonstra:
- ✅ **Arquitetura REST API** (estrutura bem definida)
- ✅ **Testes de Integração Automatizados** (258 casos de teste)
- ✅ **Documentação Técnica Sistemática** (32 bugs documentados)
- ✅ **Análise de Qualidade de Software** (relatórios executivos)
- 🟡 **Autenticação JWT** (implementação parcial)
- 🟡 **Operações CRUD** (funcional em alguns módulos)
- 🔴 **Sistema Completo End-to-End** (em desenvolvimento)

### Lições Aprendidas
- Importância de testes automatizados na identificação de problemas
- Valor da documentação sistemática de bugs
- Necessidade de validação contínua durante desenvolvimento
- Complexidade de sistemas distribuídos e suas interdependências

---

**Desenvolvido como projeto final do estágio - demonstrando habilidades em desenvolvimento, testes automatizados e análise de qualidade de software.**

> 💡 **Nota**: Este projeto reflete um cenário real de desenvolvimento onde a análise através de testes automatizados revela gaps de implementação, demonstrando a importância de QA contínuo em projetos de software.