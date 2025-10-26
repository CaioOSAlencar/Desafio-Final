const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../../../src/controllers/userController');
const { User } = require('../../../src/models');

// Mock dos models
jest.mock('../../../src/models', () => ({
  User: {
    find: jest.fn(),
    findById: jest.fn(),
    save: jest.fn()
  }
}));

describe('UserController - Testes Unitários', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: 'admin123', role: 'admin' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    
    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  describe('getUsers', () => {

    it('TC01 - Deve retornar lista de usuários sem senhas', async () => {
      // Arrange
      const mockUsers = [
        { _id: 'user1', name: 'João Silva', email: 'joao@teste.com', role: 'user' },
        { _id: 'user2', name: 'Maria Santos', email: 'maria@teste.com', role: 'admin' }
      ];
      
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUsers)
      };
      User.find.mockReturnValue(mockChain);

      // Act
      await getUsers(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockUsers
      });
    });

    it('TC02 - Deve chamar User.find com select para excluir password', async () => {
      // Arrange
      const mockChain = {
        select: jest.fn().mockResolvedValue([])
      };
      User.find.mockReturnValue(mockChain);

      // Act
      await getUsers(req, res, next);

      // Assert
      expect(User.find).toHaveBeenCalledWith();
      expect(mockChain.select).toHaveBeenCalledWith('-password');
    });

    it('TC03 - Deve retornar lista vazia quando não há usuários', async () => {
      // Arrange
      const mockChain = {
        select: jest.fn().mockResolvedValue([])
      };
      User.find.mockReturnValue(mockChain);

      // Act
      await getUsers(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: []
      });
    });

    it('TC04 - Deve tratar erros de banco de dados', async () => {
      // Arrange
      const mockError = new Error('Database error');
      const mockChain = {
        select: jest.fn().mockRejectedValue(mockError)
      };
      User.find.mockReturnValue(mockChain);

      // Act
      await getUsers(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

    it('TC05 - Deve retornar resposta com estrutura correta', async () => {
      // Arrange
      const mockUsers = [{ _id: 'user1', name: 'Teste' }];
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUsers)
      };
      User.find.mockReturnValue(mockChain);

      // Act
      await getUsers(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
          count: expect.any(Number),
          data: expect.any(Array)
        })
      );
    });

  });

  describe('getUserById', () => {

    it('TC06 - Deve retornar usuário encontrado sem senha', async () => {
      // Arrange
      req.params.id = 'user123';
      const mockUser = {
        _id: 'user123',
        name: 'João Silva',
        email: 'joao@teste.com',
        role: 'user'
      };
      
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUser)
      };
      User.findById.mockReturnValue(mockChain);

      // Act
      await getUserById(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('TC07 - Deve chamar User.findById com ID correto', async () => {
      // Arrange
      req.params.id = 'user123';
      const mockChain = {
        select: jest.fn().mockResolvedValue({ _id: 'user123' })
      };
      User.findById.mockReturnValue(mockChain);

      // Act
      await getUserById(req, res, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
    });

    it('TC08 - Deve excluir password do resultado', async () => {
      // Arrange
      req.params.id = 'user123';
      const mockChain = {
        select: jest.fn().mockResolvedValue({ _id: 'user123' })
      };
      User.findById.mockReturnValue(mockChain);

      // Act
      await getUserById(req, res, next);

      // Assert
      expect(mockChain.select).toHaveBeenCalledWith('-password');
    });

    it('TC09 - Deve retornar 404 para usuário inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      const mockChain = {
        select: jest.fn().mockResolvedValue(null)
      };
      User.findById.mockReturnValue(mockChain);

      // Act
      await getUserById(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('TC10 - Deve tratar erro na busca', async () => {
      // Arrange
      req.params.id = 'user123';
      const mockError = new Error('Database error');
      const mockChain = {
        select: jest.fn().mockRejectedValue(mockError)
      };
      User.findById.mockReturnValue(mockChain);

      // Act
      await getUserById(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

  describe('updateUser', () => {

    it('TC11 - Deve atualizar usuário existente', async () => {
      // Arrange
      req.params.id = 'user123';
      req.body = {
        name: 'João Atualizado',
        email: 'joao.novo@teste.com',
        role: 'admin'
      };
      
      const mockUser = {
        _id: 'user123',
        name: 'João Antigo',
        email: 'joao.antigo@teste.com',
        role: 'user',
        save: jest.fn().mockResolvedValue({
          _id: 'user123',
          name: 'João Atualizado',
          email: 'joao.novo@teste.com',
          role: 'admin'
        })
      };
      
      User.findById.mockResolvedValue(mockUser);

      // Act
      await updateUser(req, res, next);

      // Assert
      expect(mockUser.name).toBe('João Atualizado');
      expect(mockUser.email).toBe('joao.novo@teste.com');
      expect(mockUser.role).toBe('admin');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('TC12 - Deve manter valores existentes se não fornecidos', async () => {
      // Arrange
      req.params.id = 'user123';
      req.body = { name: 'Novo Nome' }; // Apenas name fornecido
      
      const mockUser = {
        _id: 'user123',
        name: 'Nome Antigo',
        email: 'email@teste.com',
        role: 'user',
        save: jest.fn().mockResolvedValue({
          _id: 'user123',
          name: 'Novo Nome',
          email: 'email@teste.com',
          role: 'user'
        })
      };
      
      User.findById.mockResolvedValue(mockUser);

      // Act
      await updateUser(req, res, next);

      // Assert
      expect(mockUser.name).toBe('Novo Nome');
      expect(mockUser.email).toBe('email@teste.com'); // Mantido
      expect(mockUser.role).toBe('user'); // Mantido
    });

    it('TC13 - Deve atualizar password se fornecido', async () => {
      // Arrange
      req.params.id = 'user123';
      req.body = { password: 'novaSenha123' };
      
      const mockUser = {
        _id: 'user123',
        name: 'João',
        email: 'joao@teste.com',
        role: 'user',
        password: 'senhaAntiga',
        save: jest.fn().mockResolvedValue({ _id: 'user123' })
      };
      
      User.findById.mockResolvedValue(mockUser);

      // Act
      await updateUser(req, res, next);

      // Assert
      expect(mockUser.password).toBe('novaSenha123');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('TC14 - Não deve incluir password na resposta', async () => {
      // Arrange
      req.params.id = 'user123';
      req.body = { name: 'João' };
      
      const mockUser = {
        _id: 'user123',
        name: 'João Antigo',
        email: 'joao@teste.com',
        role: 'user',
        save: jest.fn().mockResolvedValue({
          _id: 'user123',
          name: 'João',
          email: 'joao@teste.com',
          role: 'user'
        })
      };
      
      User.findById.mockResolvedValue(mockUser);

      // Act
      await updateUser(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          _id: 'user123',
          name: 'João',
          email: 'joao@teste.com',
          role: 'user'
        }
      });
    });

    it('TC15 - Deve retornar 404 para usuário inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      req.body = { name: 'Nome' };
      User.findById.mockResolvedValue(null);

      // Act
      await updateUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('TC16 - Deve tratar erro na atualização', async () => {
      // Arrange
      req.params.id = 'user123';
      req.body = { name: 'Nome' };
      const mockError = new Error('Update error');
      User.findById.mockRejectedValue(mockError);

      // Act
      await updateUser(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

  describe('deleteUser', () => {

    it('TC17 - Deve deletar usuário existente', async () => {
      // Arrange
      req.params.id = 'user123';
      const mockUser = {
        _id: 'user123',
        name: 'João Silva',
        deleteOne: jest.fn().mockResolvedValue()
      };
      User.findById.mockResolvedValue(mockUser);

      // Act
      await deleteUser(req, res, next);

      // Assert
      expect(mockUser.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User removed'
      });
    });

    it('TC18 - Deve verificar se usuário existe antes de deletar', async () => {
      // Arrange
      req.params.id = 'user123';
      const mockUser = { deleteOne: jest.fn() };
      User.findById.mockResolvedValue(mockUser);

      // Act
      await deleteUser(req, res, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
    });

    it('TC19 - Deve retornar 404 para usuário inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      User.findById.mockResolvedValue(null);

      // Act
      await deleteUser(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('TC20 - Deve tratar erro na deleção', async () => {
      // Arrange
      req.params.id = 'user123';
      const mockError = new Error('Delete error');
      const mockUser = {
        deleteOne: jest.fn().mockRejectedValue(mockError)
      };
      User.findById.mockResolvedValue(mockUser);

      // Act
      await deleteUser(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

    it('TC21 - Deve chamar deleteOne no documento encontrado', async () => {
      // Arrange
      req.params.id = 'user123';
      const mockUser = {
        _id: 'user123',
        deleteOne: jest.fn().mockResolvedValue()
      };
      User.findById.mockResolvedValue(mockUser);

      // Act
      await deleteUser(req, res, next);

      // Assert
      expect(mockUser.deleteOne).toHaveBeenCalledWith();
    });

    it('TC22 - Deve tratar erro de validação no save (updateUser)', async () => {
      // Arrange
      req.params.id = 'user123';
      req.body = { name: 'João' };
      const validationError = new Error('Validation failed');
      
      const mockUser = {
        _id: 'user123',
        name: 'João Antigo',
        email: 'joao@teste.com',
        role: 'user',
        save: jest.fn().mockRejectedValue(validationError)
      };
      
      User.findById.mockResolvedValue(mockUser);

      // Act
      await updateUser(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it('TC23 - Deve verificar estrutura da resposta em getUsers', async () => {
      // Arrange
      const mockUsers = [
        { _id: 'user1', name: 'João', email: 'joao@teste.com', role: 'user' }
      ];
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUsers)
      };
      User.find.mockReturnValue(mockChain);

      // Act
      await getUsers(req, res, next);

      // Assert
      const call = res.json.mock.calls[0][0];
      expect(call).toHaveProperty('success', true);
      expect(call).toHaveProperty('count', 1);
      expect(call).toHaveProperty('data');
      expect(Array.isArray(call.data)).toBe(true);
    });

    it('TC24 - Deve chamar User.findById com parâmetro correto', async () => {
      // Arrange
      req.params.id = 'test-user-id-456';
      User.findById.mockResolvedValue(null);

      // Act
      await deleteUser(req, res, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('test-user-id-456');
    });

    it('TC25 - Deve preservar outros campos ao atualizar apenas um campo', async () => {
      // Arrange
      req.params.id = 'user123';
      req.body = { role: 'admin' }; // Apenas role fornecido
      
      const originalUser = {
        _id: 'user123',
        name: 'João Silva',
        email: 'joao@teste.com',
        role: 'user'
      };
      
      const mockUser = {
        ...originalUser,
        save: jest.fn().mockResolvedValue({
          _id: 'user123',
          name: 'João Silva',
          email: 'joao@teste.com',
          role: 'admin'
        })
      };
      
      User.findById.mockResolvedValue(mockUser);

      // Act
      await updateUser(req, res, next);

      // Assert
      expect(mockUser.name).toBe('João Silva'); // Preservado
      expect(mockUser.email).toBe('joao@teste.com'); // Preservado
      expect(mockUser.role).toBe('admin'); // Atualizado
    });

  });

});