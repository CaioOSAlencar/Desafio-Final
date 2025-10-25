# Relatório de Melhoria - MELHORIA-001

## **Informações Básicas**
- **ID da Melhoria:** MELHORIA-001
- **Título:** Implementar validação rigorosa para campo NOME
- **User Story Relacionada:** US002 - Sistema de Autenticação
- **Data de Identificação:** 24/10/2025
- **Identificado por:** Teste Exploratório - Postman
- **Prioridade:** Média
- **Categoria:** Validação de Dados / UX

---

## **Descrição da Melhoria**

### **Situação Atual:**
O sistema permite criar contas com nomes muito curtos (ex: "Jo") ou com números (ex: "João123"), o que pode comprometer a qualidade dos dados e a experiência do usuário.

### **Melhoria Proposta:**
Implementar validações mais rigorosas para o campo NOME:
1. **Mínimo de 3 caracteres** (ao invés de apenas obrigatório)
2. **Apenas letras e espaços** (bloquear números e caracteres especiais)
3. **Formato apropriado** (primeira letra maiúscula, etc.)

---

## **Cenários de Teste Exploratório**

### **Cenários Problemáticos Identificados:**
```json
// ❌ Aceita atualmente, mas deveria ser rejeitado:
{"name": "Jo", "email": "jo@test.com", "password": "123456"}
{"name": "A", "email": "a@test.com", "password": "123456"}  
{"name": "João123", "email": "joao123@test.com", "password": "123456"}
{"name": "User@2024", "email": "user@test.com", "password": "123456"}
{"name": "123", "email": "number@test.com", "password": "123456"}
```

### **Comportamento Atual:**
- ✅ Status: 201 Created
- ✅ Usuário é criado normalmente
- ❌ Problema: Dados de baixa qualidade no banco

### **Comportamento Desejado:**
- ❌ Status: 400 Bad Request
- ❌ Mensagem: "Nome deve ter pelo menos 3 caracteres e conter apenas letras"

---

## **Impacto nos Negócios**

### **Benefícios da Melhoria:**
1. **Qualidade dos Dados:** Nomes mais consistentes e profissionais
2. **Experiência do Usuário:** Dados mais confiáveis nas reservas
3. **Credibilidade:** Sistema mais profissional
4. **Suporte:** Facilita identificação de usuários reais

### **Riscos sem a Melhoria:**
1. **Dados Inconsistentes:** Nomes como "A", "123" no sistema
2. **Problemas de Comunicação:** Dificuldade para contatar usuários
3. **Experiência Ruim:** Outros usuários veem nomes estranhos

---

## **Implementação Técnica Sugerida**

### **Validação no Mongoose Model (User.js):**
```javascript
name: {
  type: String,
  required: [true, 'Nome é obrigatório'],
  minLength: [3, 'Nome deve ter pelo menos 3 caracteres'],
  maxLength: [50, 'Nome deve ter no máximo 50 caracteres'],
  validate: {
    validator: function(name) {
      // Apenas letras, espaços e acentos
      return /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(name);
    },
    message: 'Nome deve conter apenas letras e espaços'
  },
  set: function(name) {
    // Capitalizar primeira letra de cada palavra
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
```

### **Validação no Controller (authController.js):**
```javascript
// Adicionar validação extra no register
if (name.length < 3) {
  return res.status(400).json({
    success: false,
    message: 'Nome deve ter pelo menos 3 caracteres'
  });
}

if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(name)) {
  return res.status(400).json({
    success: false,
    message: 'Nome deve conter apenas letras e espaços'
  });
}
```

---

## **Cenários de Teste para Validação**

### **Testes que Devem Falhar (400):**
1. Nome com 1 caractere: "A"
2. Nome com 2 caracteres: "Jo"  
3. Nome com números: "João123"
4. Nome com símbolos: "User@2024"
5. Nome só números: "123"

### **Testes que Devem Passar (201):**
1. Nome válido: "João Silva"
2. Nome com acentos: "José María"
3. Nome composto: "Ana Paula Santos"
4. Nome internacional: "François García"

---

## **Estimativa de Esforço**
- **Desenvolvimento:** 2 horas
- **Testes:** 1 hora
- **Documentação:** 30 minutos
- **Total:** 3.5 horas

---

## **Critérios de Aceitação**
- [ ] Nomes com menos de 3 caracteres são rejeitados
- [ ] Nomes com números são rejeitados  
- [ ] Nomes com símbolos especiais são rejeitados
- [ ] Nomes válidos são aceitos e formatados corretamente
- [ ] Mensagens de erro são claras e específicas
- [ ] Testes automatizados cobrem todos os cenários

---

**Status:** Proposta  
**Próximos Passos:** Implementar validações e criar testes automatizados  
**Responsável:** Equipe de Desenvolvimento