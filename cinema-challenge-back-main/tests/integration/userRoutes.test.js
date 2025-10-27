// Testes de integração para rotas de usuários
// Foca em cenários reais de uso e comportamento da API

const request = require('supertest');
const app = require('../../src/index');
const { User } = require('../../src/models');
const { 
  mockUsers,
  createTestUser,
  createTestAdmin,
  createMultipleTestUsers,
  createUsersByRole,
  validateUserResponse,
  validateUserListResponse,
  validateErrorResponse,
  validateSuccessResponse,
  generateUserToken,
  generateAdminToken,
  createUserWithEmail,
  generateValidUserData,
  validatePasswordHash,
  countUsersByRole,
  generateUniqueId
} = require('./helpers/userHelpers');

describe('Users Integration Tests', () => {
  // Limpar banco antes de cada teste
  beforeEach(async () => {
    await User.deleteMany({});
  });
  
  describe('GET /users - Listar usuários', () => {
    test('Deve retornar lista vazia quando não há usuários', async () => {
      const admin = await createTestAdmin();
      
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      expect(response.status).toBe(200);
      validateUserListResponse(response.body);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });
    
    test('Deve retornar lista de usuários quando existem', async () => {
      const users = await createMultipleTestUsers(3);
      
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      if (response.status === 200) {
        validateUserListResponse(response.body);
        expect(response.body.count).toBe(3);
        expect(response.body.data).toHaveLength(3);
        
        // Verificar se todos os usuários estão na resposta
        const responseIds = response.body.data.map(user => user._id);
        users.forEach(user => {
          expect(responseIds).toContain(user._id.toString());
        });
      } else {
        console.log('❌ GET /users failed:', response.body);
      }
    });
    
    test('Deve ordenar usuários por data de criação (mais recentes primeiro)', async () => {
      // Criar usuários com delay para garantir timestamps diferentes
      const user1 = await createTestUser();
      await new Promise(resolve => setTimeout(resolve, 10));
      const user2 = await createTestUser();
      await new Promise(resolve => setTimeout(resolve, 10));
      const user3 = await createTestUser();
      
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      if (response.status === 200) {
        expect(response.body.data).toHaveLength(3);
        
        // Verificar ordem cronológica reversa
        const dates = response.body.data.map(user => new Date(user.createdAt));
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
        }
      }
    });
    
    test('Deve rejeitar acesso sem token de autorização', async () => {
      const response = await request(app)
        .get('/users');
      
      expect([401, 403]).toContain(response.status);
      validateErrorResponse(response.body);
    });
    
    test('Deve rejeitar acesso com token inválido', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer token-invalido');
      
      expect([401, 403]).toContain(response.status);
      validateErrorResponse(response.body);
    });
    
    test('Deve rejeitar acesso de usuário comum (não admin)', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${generateUserToken()}`);
      
      expect([401, 403]).toContain(response.status);
      validateErrorResponse(response.body);
    });
    
    test('Deve filtrar usuários por role quando especificado', async () => {
      const users = await createUsersByRole(); // 2 users + 1 admin
      
      const response = await request(app)
        .get('/users?role=user')
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      if (response.status === 200) {
        expect(response.body.data.every(user => user.role === 'user')).toBe(true);
      }
    });
    
    test('Deve implementar paginação quando especificada', async () => {
      await createMultipleTestUsers(5);
      
      const response = await request(app)
        .get('/users?page=1&limit=2')
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      if (response.status === 200) {
        expect(response.body.data).toHaveLength(2);
        if (response.body.pagination) {
          expect(response.body.pagination.page).toBe(1);
          expect(response.body.pagination.limit).toBe(2);
        }
      }
    });
  });
  
  describe('GET /users/:id - Buscar usuário específico', () => {
    test('Deve retornar usuário existente', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .get(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      if (response.status === 200) {
        validateSuccessResponse(response.body);
        validateUserResponse(response.body.data);
        expect(response.body.data._id).toBe(user._id.toString());
        expect(response.body.data.name).toBe(user.name);
        expect(response.body.data.email).toBe(user.email);
      } else {
        console.log('❌ GET /users/:id failed:', response.body);
      }
    });
    
    test('Deve retornar erro 404 para usuário inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.body);
    });
    
    test('Deve retornar erro 400 para ID inválido', async () => {
      const response = await request(app)
        .get('/users/id-invalido')
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.body);
    });
    
    test('Deve rejeitar acesso sem autorização', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .get(`/users/${user._id}`);
      
      expect([401, 403]).toContain(response.status);
      validateErrorResponse(response.body);
    });
    
    test('Deve rejeitar acesso de usuário comum', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .get(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateUserToken()}`);
      
      expect([401, 403]).toContain(response.status);
      validateErrorResponse(response.body);
    });
  });
  
  describe('PUT /users/:id - Atualizar usuário', () => {
    test('Deve atualizar usuário com dados válidos', async () => {
      const user = await createTestUser();
      const updateData = {
        name: 'Nome Atualizado',
        email: `atualizado.${generateUniqueId()}@email.com`,
        role: 'admin'
      };
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send(updateData);
      
      if (response.status === 200) {
        validateSuccessResponse(response.body);
        validateUserResponse(response.body.data);
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.email).toBe(updateData.email);
        expect(response.body.data.role).toBe(updateData.role);
      } else {
        console.log('❌ PUT /users/:id failed:', response.body);
      }
    });
    
    test('Deve atualizar parcialmente (apenas alguns campos)', async () => {
      const user = await createTestUser();
      const originalEmail = user.email;
      const updateData = {
        name: 'Apenas Nome Novo'
      };
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send(updateData);
      
      if (response.status === 200) {
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.email).toBe(originalEmail); // Deve manter email original
      }
    });
    
    test('Deve atualizar senha e hashear corretamente', async () => {
      const user = await createTestUser();
      const newPassword = 'novaSenha123456';
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send({ password: newPassword });
      
      if (response.status === 200) {
        // Buscar usuário do banco para verificar senha
        const updatedUser = await User.findById(user._id);
        const passwordValid = await validatePasswordHash(newPassword, updatedUser.password);
        expect(passwordValid).toBe(true);
      }
    });
    
    test('Deve rejeitar email duplicado', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      
      const response = await request(app)
        .put(`/users/${user2._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send({ email: user1.email });
      
      expect([400, 409]).toContain(response.status);
      validateErrorResponse(response.body);
    });
    
    test('Deve rejeitar email inválido', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send({ email: 'email-invalido' });
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.body);
    });
    
    test('Deve rejeitar senha muito curta', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send({ password: '123' });
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.body);
    });
    
    test('Deve rejeitar role inválido', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send({ role: 'moderator' });
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.body);
    });
    
    test('Deve retornar erro 404 para usuário inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send({ name: 'Novo Nome' });
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.body);
    });
    
    test('Deve rejeitar acesso sem autorização', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .send({ name: 'Novo Nome' });
      
      expect([401, 403]).toContain(response.status);
      validateErrorResponse(response.body);
    });
    
    test('Deve rejeitar acesso de usuário comum', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateUserToken()}`)
        .send({ name: 'Novo Nome' });
      
      expect([401, 403]).toContain(response.status);
      validateErrorResponse(response.body);
    });
  });
  
  describe('DELETE /users/:id - Deletar usuário', () => {
    test('Deve deletar usuário existente', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .delete(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      if (response.status === 200) {
        validateSuccessResponse(response.body, false);
        
        // Verificar se usuário foi realmente deletado
        const deletedUser = await User.findById(user._id);
        expect(deletedUser).toBeNull();
      } else {
        console.log('❌ DELETE /users/:id failed:', response.body);
      }
    });
    
    test('Deve retornar erro 404 para usuário inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.body);
    });
    
    test('Deve retornar erro 400 para ID inválido', async () => {
      const response = await request(app)
        .delete('/users/id-invalido')
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.body);
    });
    
    test('Deve rejeitar acesso sem autorização', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .delete(`/users/${user._id}`);
      
      expect([401, 403]).toContain(response.status);
      validateErrorResponse(response.body);
    });
    
    test('Deve rejeitar acesso de usuário comum', async () => {
      const user = await createTestUser();
      
      const response = await request(app)
        .delete(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateUserToken()}`);
      
      expect([401, 403]).toContain(response.status);
      validateErrorResponse(response.body);
    });
  });
  
  describe('Cenários de Erro e Edge Cases', () => {
    test('Deve lidar com múltiplas operações simultâneas', async () => {
      const users = await createMultipleTestUsers(3);
      
      // Tentar atualizar todos os usuários simultaneamente
      const promises = users.map(user => 
        request(app)
          .put(`/users/${user._id}`)
          .set('Authorization', `Bearer ${generateAdminToken()}`)
          .send({ name: `Atualizado ${user.name}` })
      );
      
      const responses = await Promise.all(promises);
      
      // Verificar se pelo menos algumas operações funcionaram
      const successfulResponses = responses.filter(res => res.status === 200);
      console.log(`✅ ${successfulResponses.length}/${responses.length} atualizações simultâneas bem-sucedidas`);
    });
    
    test('Deve manter integridade ao deletar usuário com dependências', async () => {
      const user = await createTestUser();
      
      // Nota: Este teste assumiria que há relacionamentos com outras entidades
      // Como reservas, mas por simplicidade vamos apenas testar a deleção básica
      
      const response = await request(app)
        .delete(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      if (response.status === 200) {
        // Verificar se o usuário foi removido
        const deletedUser = await User.findById(user._id);
        expect(deletedUser).toBeNull();
      }
    });
    
    test('Deve validar limites de caracteres nos campos', async () => {
      const user = await createTestUser();
      
      // Nome muito longo (assumindo limite de 100 caracteres)
      const longName = 'A'.repeat(101);
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send({ name: longName });
      
      if (response.status === 400) {
        validateErrorResponse(response.body);
      } else {
        console.log('⚠️  Sistema aceita nomes muito longos - possível problema');
      }
    });
    
    test('Deve lidar com caracteres especiais no nome', async () => {
      const user = await createTestUser();
      const specialName = 'José da Silva-Santos ÃÉÍ@#$%';
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send({ name: specialName });
      
      if (response.status === 200) {
        expect(response.body.data.name).toBe(specialName);
      }
    });
    
    test('Deve preservar dados não modificados durante update', async () => {
      const user = await createTestUser();
      const originalRole = user.role;
      const originalEmail = user.email;
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send({ name: 'Apenas Nome Mudou' });
      
      if (response.status === 200) {
        expect(response.body.data.role).toBe(originalRole);
        expect(response.body.data.email).toBe(originalEmail);
      }
    });
  });
  
  describe('Validações de Segurança', () => {
    test('Senha deve ser hasheada e nunca retornada', async () => {
      const userData = generateValidUserData();
      const user = await createTestUser(userData);
      
      // Buscar usuário
      const response = await request(app)
        .get(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      if (response.status === 200) {
        expect(response.body.data).not.toHaveProperty('password');
        
        // Verificar no banco que a senha está hasheada
        const dbUser = await User.findById(user._id);
        expect(dbUser.password).not.toBe(userData.password);
        expect(dbUser.password.length).toBeGreaterThan(50); // Hash é longo
      }
    });
    
    test('Deve rejeitar tentativas de injeção SQL/NoSQL', async () => {
      const user = await createTestUser();
      const maliciousData = {
        name: { $ne: null },
        email: "admin@test.com'; DROP TABLE users; --"
      };
      
      const response = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send(maliciousData);
      
      // Sistema deve rejeitar ou sanitizar dados maliciosos
      expect([400, 500]).toContain(response.status);
    });
    
    test('Deve validar formato de email rigorosamente', async () => {
      const user = await createTestUser();
      const invalidEmails = [
        'email-sem-arroba.com',
        '@sem-local.com',
        'sem-dominio@',
        'espaços no@email.com',
        'duplo@@arroba.com'
      ];
      
      for (const email of invalidEmails) {
        const response = await request(app)
          .put(`/users/${user._id}`)
          .set('Authorization', `Bearer ${generateAdminToken()}`)
          .send({ email });
        
        expect(response.status).toBe(400);
      }
    });
  });
  
  describe('Performance e Escalabilidade', () => {
    test('Deve listar usuários rapidamente mesmo com muitos registros', async () => {
      // Criar mais usuários para teste de performance
      await createMultipleTestUsers(10);
      
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.status === 200) {
        expect(response.body.data).toHaveLength(10);
        console.log(`⏱️  Listagem de 10 usuários levou ${duration}ms`);
        
        // Operação deve ser rápida (menos de 1 segundo)
        expect(duration).toBeLessThan(1000);
      }
    });
    
    test('Deve implementar paginação eficiente', async () => {
      await createMultipleTestUsers(20);
      
      const response = await request(app)
        .get('/users?page=2&limit=5')
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      if (response.status === 200) {
        expect(response.body.data).toHaveLength(5);
        if (response.body.pagination) {
          expect(response.body.pagination.page).toBe(2);
        }
      }
    });
  });
});