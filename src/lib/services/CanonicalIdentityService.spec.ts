import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CanonicalIdentityService } from './CanonicalIdentityService';
import prisma from '../prisma';

describe('CanonicalIdentityService - Integration Tests', () => {
  beforeEach(async () => {
    // Limpar registros criados nos testes
    await prisma.identityAlias.deleteMany({
      where: {
        source: {
          in: ['TEST_SOURCE', 'CONCURRENT_SOURCE', 'BATCH_SOURCE']
        }
      }
    });
    await prisma.person.deleteMany({
      where: {
        source: {
          in: ['TEST_SOURCE', 'CONCURRENT_SOURCE', 'BATCH_SOURCE']
        }
      }
    });
  });

  afterEach(async () => {
    await prisma.identityAlias.deleteMany({
      where: {
        source: {
          in: ['TEST_SOURCE', 'CONCURRENT_SOURCE', 'BATCH_SOURCE']
        }
      }
    });
    await prisma.person.deleteMany({
      where: {
        source: {
          in: ['TEST_SOURCE', 'CONCURRENT_SOURCE', 'BATCH_SOURCE']
        }
      }
    });
  });

  it('should resolve a new Person and create its IdentityAlias', async () => {
    const person = await CanonicalIdentityService.resolve({
      source: 'TEST_SOURCE',
      externalId: '123',
      name: 'João Teste',
      email: 'joao@TESTE.com',
      phone: '11988887777'
    });

    expect(person.id).toBeDefined();
    expect(person.fullName).toBe('João Teste');
    expect(person.email).toBe('joao@teste.com');
    expect(person.phoneNumber).toBe('+5511988887777');

    const alias = await prisma.identityAlias.findUnique({
      where: {
        source_externalId: { source: 'TEST_SOURCE', externalId: '123' }
      }
    });

    expect(alias).toBeDefined();
    expect(alias?.personId).toBe(person.id);
  });

  it('should always resolve to the exact same Person for the same source and externalId', async () => {
    const p1 = await CanonicalIdentityService.resolve({
      source: 'TEST_SOURCE',
      externalId: '123',
      name: 'João Teste'
    });

    const p2 = await CanonicalIdentityService.resolve({
      source: 'TEST_SOURCE',
      externalId: '123',
      name: 'João Teste Alterado'
    });

    expect(p1.id).toBe(p2.id);
  });

  it('should enrich the existing Person with new reliable details', async () => {
    const p1 = await CanonicalIdentityService.resolve({
      source: 'TEST_SOURCE',
      externalId: '123',
      name: 'João Teste'
    });

    expect(p1.email).toBeNull();

    const p2 = await CanonicalIdentityService.resolve({
      source: 'TEST_SOURCE',
      externalId: '123',
      email: 'joao@teste.com',
      phone: '11988887777'
    });

    expect(p2.id).toBe(p1.id);
    expect(p2.email).toBe('joao@teste.com');
    expect(p2.phoneNumber).toBe('+5511988887777');
    expect(p2.fullName).toBe('João Teste');
  });

  it('should handle extreme concurrency and create only one Person with zero orphans', async () => {
    const input = {
      source: 'CONCURRENT_SOURCE',
      externalId: '999',
      name: 'Concorrente'
    };

    // Executar 15 chamadas em paralelo simultaneamente
    const promises = Array.from({ length: 15 }, () => CanonicalIdentityService.resolve(input));
    const results = await Promise.all(promises);

    const firstId = results[0].id;
    for (const p of results) {
      expect(p.id).toBe(firstId);
    }

    const personsCount = await prisma.person.count({
      where: { source: 'CONCURRENT_SOURCE' }
    });
    const aliasesCount = await prisma.identityAlias.count({
      where: { source: 'CONCURRENT_SOURCE', externalId: '999' }
    });

    expect(personsCount).toBe(1);
    expect(aliasesCount).toBe(1);
  });

  it('should resolveMany idempotently', async () => {
    const batch = [
      { source: 'BATCH_SOURCE', externalId: '1', name: 'User 1' },
      { source: 'BATCH_SOURCE', externalId: '2', name: 'User 2' },
      { source: 'BATCH_SOURCE', externalId: '1', name: 'User 1 Repetido' }
    ];

    const map1 = await CanonicalIdentityService.resolveMany(batch);
    expect(map1.size).toBe(2);
    expect(map1.get('BATCH_SOURCE:1')).toBeDefined();
    expect(map1.get('BATCH_SOURCE:2')).toBeDefined();

    const map2 = await CanonicalIdentityService.resolveMany(batch);
    expect(map2.size).toBe(2);
    expect(map2.get('BATCH_SOURCE:1')).toBe(map1.get('BATCH_SOURCE:1'));
    expect(map2.get('BATCH_SOURCE:2')).toBe(map1.get('BATCH_SOURCE:2'));

    const count = await prisma.person.count({ where: { source: 'BATCH_SOURCE' } });
    expect(count).toBe(2);
  });
});
