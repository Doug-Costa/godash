import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IdentityMatchingService } from './IdentityMatchingService';
import { CanonicalIdentityService } from './CanonicalIdentityService';
import prisma from '../prisma';

describe('IdentityMatchingService - Integration Tests', () => {
  let adminUserId = '';

  beforeEach(async () => {
    // Garantir que existe um admin user no banco para realizar a revisão
    const admin = await prisma.user.upsert({
      where: { email: 'admin@dentalgo.com' },
      update: {},
      create: {
        name: 'Admin Test',
        email: 'admin@dentalgo.com',
        role: 'ADMIN',
        isActive: true
      }
    });
    adminUserId = admin.id;

    // Limpar tabelas afetadas nos testes
    await prisma.identityReview.deleteMany();
    await prisma.mergeEvent.deleteMany();
    await prisma.journey.deleteMany({ where: { id: 'j-1' } });
    await prisma.identityAlias.deleteMany({
      where: {
        source: {
          in: ['SOURCE_A', 'SOURCE_B', 'FORM_SOURCE', 'TEST_MATCH']
        }
      }
    });
    await prisma.person.deleteMany({
      where: {
        source: {
          in: ['SOURCE_A', 'SOURCE_B', 'FORM_SOURCE', 'TEST_MATCH']
        }
      }
    });
  });

  afterEach(async () => {
    await prisma.identityReview.deleteMany();
    await prisma.mergeEvent.deleteMany();
    await prisma.journey.deleteMany({ where: { id: 'j-1' } });
    await prisma.identityAlias.deleteMany({
      where: {
        source: {
          in: ['SOURCE_A', 'SOURCE_B', 'FORM_SOURCE', 'TEST_MATCH']
        }
      }
    });
    await prisma.person.deleteMany({
      where: {
        source: {
          in: ['SOURCE_A', 'SOURCE_B', 'FORM_SOURCE', 'TEST_MATCH']
        }
      }
    });
  });

  it('should treat same externalId from different sources as separate and NOT auto-merge them', async () => {
    const resA = await IdentityMatchingService.analyzeAndMatch({
      source: 'SOURCE_A',
      externalId: '1000',
      email: 'user@example.com'
    });

    const resB = await IdentityMatchingService.analyzeAndMatch({
      source: 'SOURCE_B',
      externalId: '1000',
      email: 'user_different@example.com'
    });

    expect(resA.action).toBe('AUTO_RESOLVED');
    expect(resB.action).toBe('AUTO_RESOLVED');
    expect(resA.personId).not.toBe(resB.personId);
  });

  it('should flag ambiguous cases for IdentityReview instead of auto-merging them', async () => {
    const existingPerson = await CanonicalIdentityService.resolve({
      source: 'TEST_MATCH',
      externalId: '1',
      email: 'colisao@teste.com',
      name: 'Mauricio Silva'
    });

    const matchRes = await IdentityMatchingService.analyzeAndMatch({
      source: 'FORM_SOURCE',
      externalId: 'form_999',
      email: 'colisao@teste.com',
      name: 'Mauricio Silva Jr.'
    });

    expect(matchRes.action).toBe('REVIEW_REQUIRED');
    expect(matchRes.reviewId).toBeDefined();

    const review = await prisma.identityReview.findUnique({
      where: { id: matchRes.reviewId }
    });
    expect(review).toBeDefined();
    expect(review?.status).toBe('PENDING');
    expect(review?.candidatePersonId).toBe(existingPerson.id);
  });

  it('should apply LINK action pointing alias to chosen Person and completing the review', async () => {
    const existingPerson = await CanonicalIdentityService.resolve({
      source: 'TEST_MATCH',
      externalId: '1',
      email: 'colisao@teste.com',
      name: 'Mauricio Silva'
    });

    const matchRes = await IdentityMatchingService.analyzeAndMatch({
      source: 'FORM_SOURCE',
      externalId: 'form_999',
      email: 'colisao@teste.com',
      name: 'Mauricio'
    });

    expect(matchRes.action).toBe('REVIEW_REQUIRED');

    await IdentityMatchingService.link(matchRes.reviewId!, existingPerson.id, adminUserId);

    const alias = await prisma.identityAlias.findUnique({
      where: {
        source_externalId: { source: 'FORM_SOURCE', externalId: 'form_999' }
      }
    });
    expect(alias).toBeDefined();
    expect(alias?.personId).toBe(existingPerson.id);

    const review = await prisma.identityReview.findUnique({
      where: { id: matchRes.reviewId! }
    });
    expect(review?.status).toBe('PROCESSED');
    expect(review?.decision).toBe('LINK');
    expect(review?.reviewedById).toBe(adminUserId);
  });

  it('should apply REJECT action creating new independent Person and alias', async () => {
    // Criar Person inicial para colidir
    await CanonicalIdentityService.resolve({
      source: 'TEST_MATCH',
      externalId: '1',
      email: 'colisao@teste.com',
      name: 'Mauricio Silva'
    });

    const matchRes = await IdentityMatchingService.analyzeAndMatch({
      source: 'FORM_SOURCE',
      externalId: 'form_999',
      email: 'colisao@teste.com',
      name: 'Mauricio Silva'
    });

    expect(matchRes.action).toBe('REVIEW_REQUIRED');

    const newPerson = await IdentityMatchingService.reject(matchRes.reviewId!, adminUserId);
    expect(newPerson.id).toBeDefined();

    const alias = await prisma.identityAlias.findUnique({
      where: {
        source_externalId: { source: 'FORM_SOURCE', externalId: 'form_999' }
      }
    });
    expect(alias).toBeDefined();
    expect(alias?.personId).toBe(newPerson.id);

    const review = await prisma.identityReview.findUnique({
      where: { id: matchRes.reviewId! }
    });
    expect(review?.status).toBe('PROCESSED');
    expect(review?.decision).toBe('REJECT');
  });

  it('should apply DEFER action postponing the decision', async () => {
    // Criar Person inicial para colidir
    await CanonicalIdentityService.resolve({
      source: 'TEST_MATCH',
      externalId: '1',
      email: 'colisao@teste.com',
      name: 'Mauricio Silva'
    });

    const matchRes = await IdentityMatchingService.analyzeAndMatch({
      source: 'FORM_SOURCE',
      externalId: 'form_999',
      email: 'colisao@teste.com',
      name: 'Mauricio Silva'
    });

    expect(matchRes.action).toBe('REVIEW_REQUIRED');

    await IdentityMatchingService.defer(matchRes.reviewId!, adminUserId);

    const review = await prisma.identityReview.findUnique({
      where: { id: matchRes.reviewId! }
    });
    expect(review?.status).toBe('DEFERRED');
    expect(review?.decision).toBe('DEFER');
  });

  it('should merge two Persons, transfer context and logs, and document it via MergeEvent', async () => {
    // Criar Journey correspondente
    await prisma.journey.create({
      data: {
        id: 'j-1',
        name: 'Jornada Teste',
        status: 'ACTIVE',
        objective: 'Testes',
        campaignNature: 'COMMERCIAL'
      }
    });

    // 1. Criar Person A (Source) com Customer e Histórico
    const personA = await CanonicalIdentityService.resolve({
      source: 'TEST_MATCH',
      externalId: 'A1',
      email: 'personA@teste.com',
      name: 'Person A'
    });

    const customerA = await prisma.customer.create({
      data: {
        personId: personA.id,
        externalPersonId: 101,
        journeyId: 'j-1',
        stage: 'oportunidade'
      }
    });

    const intA = await prisma.interaction.create({
      data: {
        customerId: customerA.id,
        text: 'Interação da Person A'
      }
    });

    // 2. Criar Person B (Target/Surviving) com Customer na mesma jornada (para testar colisão)
    const personB = await CanonicalIdentityService.resolve({
      source: 'TEST_MATCH',
      externalId: 'B1',
      email: 'personB@teste.com',
      name: 'Person B'
    });

    const customerB = await prisma.customer.create({
      data: {
        personId: personB.id,
        externalPersonId: 102,
        journeyId: 'j-1', // mesma jornada (conflito)
        stage: 'ganho'
      }
    });

    // 3. Executar o Merge
    await IdentityMatchingService.mergePersons(personA.id, personB.id, adminUserId, 'Duplicado comercial');

    // 4. Assertivas de Verificação
    // A) Person A deve ter sido deletada
    const deletedPerson = await prisma.person.findUnique({ where: { id: personA.id } });
    expect(deletedPerson).toBeNull();

    // B) Person B deve sobreviver
    const survivingPerson = await prisma.person.findUnique({ where: { id: personB.id } });
    expect(survivingPerson).toBeDefined();

    // C) O MergeEvent deve existir com metadados corretos
    const mergeEvent = await prisma.mergeEvent.findFirst({
      where: { sourcePersonId: personA.id, targetPersonId: personB.id }
    });
    expect(mergeEvent).toBeDefined();
    expect(mergeEvent?.reason).toBe('Duplicado comercial');
    expect(mergeEvent?.decidedById).toBe(adminUserId);

    // D) O Customer redundante de Person A foi deletado devido à colisão de jornada
    const deletedCust = await prisma.customer.findUnique({ where: { id: customerA.id } });
    expect(deletedCust).toBeNull();

    // E) A interação de Customer A deve ter sido transferida com sucesso para o Customer B sobrevivente
    const updatedInt = await prisma.interaction.findUnique({ where: { id: intA.id } });
    expect(updatedInt?.customerId).toBe(customerB.id);
  });
});
