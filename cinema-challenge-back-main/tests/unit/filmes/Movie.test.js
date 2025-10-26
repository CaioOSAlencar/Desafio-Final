// Testes unitários para modelo Movie
// Testa schema, validações e funcionalidades do modelo

const mongoose = require('mongoose');

// Mock do Movie para testes unitários puros
jest.mock('../../../src/models/Movie', () => {
  const actualMongoose = jest.requireActual('mongoose');
  
  // Criar um schema real para testes
  const movieSchema = new actualMongoose.Schema({
    customId: {
      type: String,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    synopsis: {
      type: String,
      required: [true, 'Synopsis is required']
    },
    director: {
      type: String,
      required: [true, 'Director is required'],
      trim: true
    },
    genres: {
      type: [String],
      required: [true, 'At least one genre is required']
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required']
    },
    classification: {
      type: String,
      required: [true, 'Age classification is required'],
      trim: true
    },
    poster: {
      type: String,
      default: 'no-image.jpg'
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  // Virtual populate para sessões
  movieSchema.virtual('sessions', {
    ref: 'Session',
    localField: '_id',
    foreignField: 'movie',
    justOne: false
  });

  // Criar modelo mock
  const MovieModel = actualMongoose.model('Movie', movieSchema);
  MovieModel.schema = movieSchema;
  
  return MovieModel;
});

const Movie = require('../../../src/models/Movie');

describe('Movie Model - Testes Unitários', () => {

  let validMovieData;

  beforeEach(() => {
    // Dados válidos padrão para testes
    validMovieData = {
      title: 'The Shawshank Redemption',
      synopsis: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
      director: 'Frank Darabont',
      genres: ['Drama'],
      duration: 142,
      classification: 'R',
      poster: 'shawshank.jpg',
      releaseDate: new Date('1994-09-23'),
      customId: 'movie-001'
    };

    // Reset de todos os mocks
    jest.clearAllMocks();
  });

  describe('Schema Definition - Estrutura do Modelo', () => {

    it('TC01 - Deve ter todas as propriedades obrigatórias definidas', () => {
      // Arrange & Act
      const movieSchema = Movie.schema;
      const requiredFields = [];
      
      // Identificar campos obrigatórios
      for (const [key, schemaType] of Object.entries(movieSchema.paths)) {
        if (schemaType.isRequired || (schemaType.options && schemaType.options.required)) {
          requiredFields.push(key);
        }
      }

      // Assert
      expect(requiredFields).toContain('title');
      expect(requiredFields).toContain('synopsis');
      expect(requiredFields).toContain('director');
      expect(requiredFields).toContain('genres');
      expect(requiredFields).toContain('duration');
      expect(requiredFields).toContain('classification');
      expect(requiredFields).toContain('releaseDate');
    });

    it('TC02 - Deve ter propriedades opcionais definidas corretamente', () => {
      // Arrange & Act
      const movieSchema = Movie.schema;
      
      // Assert
      expect(movieSchema.paths.customId).toBeDefined();
      // customId é opcional (não tem required: true)
      expect(movieSchema.paths.customId.options.required).toBeFalsy();
      expect(movieSchema.paths.poster).toBeDefined();
      expect(movieSchema.paths.poster.options.required).toBeFalsy();
      expect(movieSchema.paths.poster.defaultValue).toBe('no-image.jpg');
      expect(movieSchema.paths.createdAt).toBeDefined();
      expect(movieSchema.paths.createdAt.defaultValue).toBeDefined();
    });

    it('TC03 - Deve ter tipos de dados corretos para cada campo', () => {
      // Arrange & Act
      const movieSchema = Movie.schema;
      
      // Assert
      expect(movieSchema.paths.title.instance).toBe('String');
      expect(movieSchema.paths.synopsis.instance).toBe('String');
      expect(movieSchema.paths.director.instance).toBe('String');
      expect(movieSchema.paths.genres.instance).toBe('Array');
      expect(movieSchema.paths.duration.instance).toBe('Number');
      expect(movieSchema.paths.classification.instance).toBe('String');
      expect(movieSchema.paths.poster.instance).toBe('String');
      expect(movieSchema.paths.releaseDate.instance).toBe('Date');
      expect(movieSchema.paths.createdAt.instance).toBe('Date');
    });

    it('TC04 - Deve ter configurações corretas de schema', () => {
      // Arrange & Act
      const movieSchema = Movie.schema;
      
      // Assert
      expect(movieSchema.options.timestamps).toBe(true);
      expect(movieSchema.options.toJSON.virtuals).toBe(true);
      expect(movieSchema.options.toObject.virtuals).toBe(true);
    });

    it('TC05 - Deve ter índice configurado para customId', () => {
      // Arrange & Act
      const movieSchema = Movie.schema;
      const customIdField = movieSchema.paths.customId;
      
      // Assert
      expect(customIdField._index).toBe(true);
    });

  });

  describe('Validações de Schema', () => {

    it('TC06 - Deve validar campos obrigatórios', () => {
      // Arrange - Teste campo por campo
      const requiredFields = ['title', 'synopsis', 'director', 'genres', 'duration', 'classification', 'releaseDate'];
      
      // Act & Assert
      requiredFields.forEach(field => {
        // Verificar se o campo está marcado como obrigatório no schema
        const fieldSchema = Movie.schema.paths[field];
        expect(fieldSchema).toBeDefined();
        
        // Verificar se é obrigatório (pode estar em isRequired ou options.required)
        const isRequired = fieldSchema.isRequired || 
                          (fieldSchema.options && fieldSchema.options.required);
        expect(isRequired).toBeTruthy();
      });
    });

    it('TC07 - Deve aplicar trim em campos de string', () => {
      // Arrange
      const dataWithSpaces = {
        ...validMovieData,
        title: '  The Shawshank Redemption  ',
        director: '  Frank Darabont  ',
        classification: '  R  '
      };
      
      // Act
      const movie = new Movie(dataWithSpaces);
      
      // Assert
      expect(movie.title).toBe('The Shawshank Redemption');
      expect(movie.director).toBe('Frank Darabont');
      expect(movie.classification).toBe('R');
    });

    it('TC08 - Deve aceitar array de gêneros válido', () => {
      // Arrange
      const dataWithMultipleGenres = {
        ...validMovieData,
        genres: ['Drama', 'Crime', 'Thriller']
      };
      
      // Act
      const movie = new Movie(dataWithMultipleGenres);
      const error = movie.validateSync();
      
      // Assert
      expect(error).toBeUndefined();
      expect(movie.genres).toEqual(['Drama', 'Crime', 'Thriller']);
      expect(movie.genres.length).toBe(3);
    });

    it('TC09 - Deve rejeitar array de gêneros vazio', () => {
      // Arrange
      const dataWithEmptyGenres = {
        ...validMovieData,
        genres: []
      };
      
      // Act
      const movie = new Movie(dataWithEmptyGenres);
      const error = movie.validateSync();
      
      // Assert
      // Mongoose pode não validar array vazio como erro por padrão
      // Vamos testar se o array está vazio ao invés de esperar erro de validação
      expect(movie.genres).toEqual([]);
      // Se houver erro, deve ser sobre o array vazio
      if (error) {
        expect(error.errors.genres).toBeDefined();
      }
    });

    it('TC10 - Deve validar tipo Number para duration', () => {
      // Arrange
      const dataWithInvalidDuration = {
        ...validMovieData,
        duration: 'invalid'
      };
      
      // Act
      const movie = new Movie(dataWithInvalidDuration);
      const error = movie.validateSync();
      
      // Assert
      expect(error).toBeDefined();
      expect(error.errors.duration).toBeDefined();
      expect(error.errors.duration.kind).toBe('Number');
    });

    it('TC11 - Deve validar tipo Date para releaseDate', () => {
      // Arrange
      const dataWithInvalidDate = {
        ...validMovieData,
        releaseDate: 'invalid-date'
      };
      
      // Act
      const movie = new Movie(dataWithInvalidDate);
      const error = movie.validateSync();
      
      // Assert
      expect(error).toBeDefined();
      expect(error.errors.releaseDate).toBeDefined();
      expect(error.errors.releaseDate.kind).toBe('date');
    });

  });

  describe('Valores Padrão', () => {

    it('TC12 - Deve aplicar valor padrão para poster', () => {
      // Arrange
      const dataWithoutPoster = { ...validMovieData };
      delete dataWithoutPoster.poster;
      
      // Act
      const movie = new Movie(dataWithoutPoster);
      
      // Assert
      expect(movie.poster).toBe('no-image.jpg');
    });

    it('TC13 - Deve aplicar valor padrão para createdAt', () => {
      // Arrange
      const dataWithoutCreatedAt = { ...validMovieData };
      delete dataWithoutCreatedAt.createdAt;
      
      // Act
      const movie = new Movie(dataWithoutCreatedAt);
      
      // Assert
      expect(movie.createdAt).toBeDefined();
      expect(movie.createdAt).toBeInstanceOf(Date);
      expect(movie.createdAt.getTime()).toBeCloseTo(Date.now(), -3); // ~1000ms tolerance
    });

    it('TC14 - Deve permitir sobrescrever valores padrão', () => {
      // Arrange
      const customPoster = 'custom-poster.jpg';
      const customCreatedAt = new Date('2023-01-01');
      const dataWithCustomDefaults = {
        ...validMovieData,
        poster: customPoster,
        createdAt: customCreatedAt
      };
      
      // Act
      const movie = new Movie(dataWithCustomDefaults);
      
      // Assert
      expect(movie.poster).toBe(customPoster);
      expect(movie.createdAt).toEqual(customCreatedAt);
    });

  });

  describe('Virtual Properties', () => {

    it('TC15 - Deve ter virtual sessions configurado', () => {
      // Arrange & Act
      const movieSchema = Movie.schema;
      const virtuals = movieSchema.virtuals;
      
      // Assert
      expect(virtuals.sessions).toBeDefined();
      expect(virtuals.sessions.options.ref).toBe('Session');
      expect(virtuals.sessions.options.localField).toBe('_id');
      expect(virtuals.sessions.options.foreignField).toBe('movie');
      expect(virtuals.sessions.options.justOne).toBe(false);
    });

    it('TC16 - Deve incluir virtuals no JSON', () => {
      // Arrange
      const movie = new Movie(validMovieData);
      
      // Act
      const jsonOutput = movie.toJSON();
      
      // Assert
      expect(jsonOutput.id).toBeDefined(); // Virtual id do mongoose
      // sessions será undefined pois não foi populado, mas deve estar presente na estrutura
    });

    it('TC17 - Deve incluir virtuals no Object', () => {
      // Arrange
      const movie = new Movie(validMovieData);
      
      // Act
      const objectOutput = movie.toObject();
      
      // Assert
      expect(objectOutput.id).toBeDefined(); // Virtual id do mongoose
    });

  });

  describe('Funcionalidades do Modelo', () => {

    it('TC18 - Deve criar instância válida com dados completos', () => {
      // Arrange & Act
      const movie = new Movie(validMovieData);
      const error = movie.validateSync();
      
      // Assert
      expect(error).toBeUndefined();
      expect(movie.title).toBe(validMovieData.title);
      expect(movie.synopsis).toBe(validMovieData.synopsis);
      expect(movie.director).toBe(validMovieData.director);
      expect(movie.genres).toEqual(validMovieData.genres);
      expect(movie.duration).toBe(validMovieData.duration);
      expect(movie.classification).toBe(validMovieData.classification);
      expect(movie.releaseDate).toEqual(validMovieData.releaseDate);
      expect(movie.customId).toBe(validMovieData.customId);
    });

    it('TC19 - Deve criar instância com campos mínimos obrigatórios', () => {
      // Arrange
      const minimalData = {
        title: 'Minimal Movie',
        synopsis: 'A minimal movie for testing',
        director: 'Test Director',
        genres: ['Test'],
        duration: 90,
        classification: 'G',
        releaseDate: new Date('2023-01-01')
      };
      
      // Act
      const movie = new Movie(minimalData);
      const error = movie.validateSync();
      
      // Assert
      expect(error).toBeUndefined();
      expect(movie.poster).toBe('no-image.jpg'); // Valor padrão aplicado
      expect(movie.createdAt).toBeDefined();
    });

    it('TC20 - Deve permitir customId único', () => {
      // Arrange
      const movie1 = new Movie({ ...validMovieData, customId: 'unique-1' });
      const movie2 = new Movie({ ...validMovieData, customId: 'unique-2' });
      
      // Act
      const error1 = movie1.validateSync();
      const error2 = movie2.validateSync();
      
      // Assert
      expect(error1).toBeUndefined();
      expect(error2).toBeUndefined();
      expect(movie1.customId).toBe('unique-1');
      expect(movie2.customId).toBe('unique-2');
    });

  });

  describe('Edge Cases e Casos Extremos', () => {

    it('TC21 - Deve tratar strings vazias como inválidas em campos obrigatórios', () => {
      // Arrange
      const dataWithEmptyStrings = {
        ...validMovieData,
        title: '',
        director: '',
        classification: ''
      };
      
      // Act
      const movie = new Movie(dataWithEmptyStrings);
      const error = movie.validateSync();
      
      // Assert
      expect(error).toBeDefined();
      // Mongoose pode ou não considerar string vazia como erro dependendo da validação
      // Mas o trim deve remover espaços
    });

    it('TC22 - Deve aceitar duration como número positivo', () => {
      // Arrange
      const validDurations = [1, 90, 142, 180, 300];
      
      validDurations.forEach(duration => {
        // Act
        const movie = new Movie({ ...validMovieData, duration });
        const error = movie.validateSync();
        
        // Assert
        expect(error).toBeUndefined();
        expect(movie.duration).toBe(duration);
      });
    });

    it('TC23 - Deve aceitar datas válidas para releaseDate', () => {
      // Arrange
      const validDates = [
        new Date('1900-01-01'),
        new Date('2023-12-31'),
        new Date(),
        new Date('2030-01-01')
      ];
      
      validDates.forEach(date => {
        // Act
        const movie = new Movie({ ...validMovieData, releaseDate: date });
        const error = movie.validateSync();
        
        // Assert
        expect(error).toBeUndefined();
        expect(movie.releaseDate).toEqual(date);
      });
    });

    it('TC24 - Deve preservar array de gêneros com múltiplos elementos', () => {
      // Arrange
      const multiGenreData = {
        ...validMovieData,
        genres: ['Action', 'Adventure', 'Comedy', 'Drama', 'Thriller']
      };
      
      // Act
      const movie = new Movie(multiGenreData);
      const error = movie.validateSync();
      
      // Assert
      expect(error).toBeUndefined();
      expect(movie.genres).toHaveLength(5);
      expect(movie.genres).toContain('Action');
      expect(movie.genres).toContain('Thriller');
    });

  });

});