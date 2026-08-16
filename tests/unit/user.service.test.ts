import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createUserSchema, updateUserSchema } from '../../src/schemas/user.schema';
import { createUser, updateUser, getUserById } from '../../src/services/user.service';

const mocks = vi.hoisted(() => {
  const userFindOne = vi.fn();
  const userCreate = vi.fn();
  const signPasswordResetToken = vi.fn();
  return { userFindOne, userCreate, signPasswordResetToken };
});

vi.mock('../../src/models', () => ({
  db: {
    User: {
      findOne: mocks.userFindOne,
      create: mocks.userCreate,
      findAll: vi.fn(),
      findAndCountAll: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

vi.mock('../../src/utils/jwt', () => ({
  signPasswordResetToken: mocks.signPasswordResetToken,
}));

interface UserLike {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  profileImage: string | null;
  churchId: string | null;
  church?: { id: string; name: string } | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  occupation: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  notes: string | null;
  isActive: boolean;
  isApproved: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  update(values: Record<string, unknown>): Promise<UserLike>;
}

function makeUser(overrides: Partial<UserLike> = {}): UserLike {
  const base: UserLike = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    role: 'leader',
    phone: null,
    profileImage: null,
    churchId: 'church-1',
    church: { id: 'church-1', name: 'Iglesia Central' },
    address: 'Av. Los Olivos 123',
    city: 'Lima',
    state: 'Lima',
    zipCode: '15001',
    dateOfBirth: '1990-05-05',
    gender: 'male',
    maritalStatus: 'married',
    occupation: 'Ingeniero',
    emergencyContact: 'Ana Pérez',
    emergencyPhone: '999888777',
    notes: 'Nota de prueba',
    isActive: true,
    isApproved: true,
    lastLogin: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    update: vi.fn(async function (this: UserLike, values: Record<string, unknown>) {
      Object.assign(this, values);
      return this;
    }),
  };
  return { ...base, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('user.schema - campos personales', () => {
  const baseCreate = {
    email: 'test@example.com',
    password: 'Password123',
    firstName: 'Juan',
    lastName: 'Pérez',
  };

  it('acepta los campos personales en create y los transforma a null si vienen vacíos', () => {
    const result = createUserSchema.parse({
      ...baseCreate,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      occupation: '',
      emergencyContact: '',
      emergencyPhone: '',
      notes: '',
    });

    expect(result.address).toBeNull();
    expect(result.city).toBeNull();
    expect(result.state).toBeNull();
    expect(result.zipCode).toBeNull();
    expect(result.dateOfBirth).toBeNull();
    expect(result.gender).toBeNull();
    expect(result.maritalStatus).toBeNull();
    expect(result.occupation).toBeNull();
    expect(result.emergencyContact).toBeNull();
    expect(result.emergencyPhone).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('conserva los valores no vacíos en create', () => {
    const result = createUserSchema.parse({
      ...baseCreate,
      address: 'Av. Principal 100',
      city: 'Cusco',
      dateOfBirth: '1985-01-20',
      gender: 'female',
      maritalStatus: 'single',
    });

    expect(result.address).toBe('Av. Principal 100');
    expect(result.city).toBe('Cusco');
    expect(result.dateOfBirth).toBe('1985-01-20');
    expect(result.gender).toBe('female');
    expect(result.maritalStatus).toBe('single');
  });

  it('rechaza una fecha de nacimiento inválida en create', () => {
    expect(() =>
      createUserSchema.parse({ ...baseCreate, dateOfBirth: '1990-13-45' }),
    ).toThrow();
  });

  it('rechaza un género inválido en create', () => {
    expect(() => createUserSchema.parse({ ...baseCreate, gender: 'alien' })).toThrow();
  });

  it('permite limpiar un campo en update enviándolo vacío', () => {
    const result = updateUserSchema.parse({
      address: '',
      notes: '  ',
      gender: '',
      maritalStatus: 'widowed',
    });

    expect(result.address).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.gender).toBeNull();
    expect(result.maritalStatus).toBe('widowed');
  });
});

describe('user.service - persistencia de campos personales', () => {
  it('persiste los campos personales en createUser', async () => {
    const user = makeUser();
    mocks.userFindOne.mockResolvedValueOnce(null).mockResolvedValueOnce(user);
    mocks.userCreate.mockResolvedValue(user);

    const result = await createUser('actor-1', {
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'Juan',
      lastName: 'Pérez',
      role: 'leader',
      churchId: 'church-1',
      address: 'Av. Los Olivos 123',
      city: 'Lima',
      state: 'Lima',
      zipCode: '15001',
      dateOfBirth: '1990-05-05',
      gender: 'male',
      maritalStatus: 'married',
      occupation: 'Ingeniero',
      emergencyContact: 'Ana Pérez',
      emergencyPhone: '999888777',
      notes: 'Nota de prueba',
    });

    expect(mocks.userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        address: 'Av. Los Olivos 123',
        city: 'Lima',
        state: 'Lima',
        zipCode: '15001',
        dateOfBirth: '1990-05-05',
        gender: 'male',
        maritalStatus: 'married',
        occupation: 'Ingeniero',
        emergencyContact: 'Ana Pérez',
        emergencyPhone: '999888777',
        notes: 'Nota de prueba',
      }),
    );

    expect(result.address).toBe('Av. Los Olivos 123');
    expect(result.dateOfBirth).toBe('1990-05-05');
    expect(result.gender).toBe('male');
    expect(result.notes).toBe('Nota de prueba');
  });

  it('persiste null cuando los campos personales no se envían en createUser', async () => {
    const user = makeUser({ address: null, city: null, dateOfBirth: null, gender: null });
    mocks.userFindOne.mockResolvedValueOnce(null).mockResolvedValueOnce(user);
    mocks.userCreate.mockResolvedValue(user);

    const result = await createUser('actor-1', {
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'Juan',
      lastName: 'Pérez',
      role: 'leader',
      address: null,
      city: null,
      dateOfBirth: null,
      gender: null,
      maritalStatus: null,
      occupation: null,
      emergencyContact: null,
      emergencyPhone: null,
      notes: null,
    });

    expect(mocks.userCreate).toHaveBeenCalledWith(
      expect.objectContaining({ address: null, city: null, dateOfBirth: null }),
    );
    expect(result.address).toBeNull();
  });

  it('actualiza los campos personales en updateUser', async () => {
    const user = makeUser();
    mocks.userFindOne.mockResolvedValue(user);

    const result = await updateUser('church-1', 'user-1', 'actor-1', {
      city: 'Arequipa',
      notes: 'Nota actualizada',
      gender: 'female',
    });

    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        city: 'Arequipa',
        notes: 'Nota actualizada',
        gender: 'female',
      }),
    );
    expect(result.city).toBe('Arequipa');
    expect(result.notes).toBe('Nota actualizada');
    expect(result.gender).toBe('female');
  });

  it('limpia un campo personal en updateUser enviándolo como null', async () => {
    const user = makeUser();
    mocks.userFindOne.mockResolvedValue(user);

    await updateUser('church-1', 'user-1', 'actor-1', {
      address: null,
      occupation: null,
    });

    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({ address: null, occupation: null }),
    );
  });

  it('expone los campos personales en getUserById', async () => {
    const user = makeUser();
    mocks.userFindOne.mockResolvedValue(user);

    const result = await getUserById('church-1', 'user-1');

    expect(result.address).toBe('Av. Los Olivos 123');
    expect(result.city).toBe('Lima');
    expect(result.state).toBe('Lima');
    expect(result.zipCode).toBe('15001');
    expect(result.dateOfBirth).toBe('1990-05-05');
    expect(result.gender).toBe('male');
    expect(result.maritalStatus).toBe('married');
    expect(result.occupation).toBe('Ingeniero');
    expect(result.emergencyContact).toBe('Ana Pérez');
    expect(result.emergencyPhone).toBe('999888777');
    expect(result.notes).toBe('Nota de prueba');
  });
});
