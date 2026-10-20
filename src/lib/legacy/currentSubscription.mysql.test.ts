/**
 * Teste de integração da regra de assinatura atual contra um MySQL real.
 * Só roda com MYSQL_TEST_URL definida (banco descartável — as tabelas são recriadas):
 *
 *   docker run -d --rm --name godash-mysql-test -e MYSQL_ROOT_PASSWORD=teste \
 *     -e MYSQL_DATABASE=godash_test -p 127.0.0.1:33306:3306 mysql:8.0
 *   MYSQL_TEST_URL=mysql://root:teste@127.0.0.1:33306/godash_test npx vitest run src/lib/legacy
 */
import mysql from 'mysql2/promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CustomerRelationshipService } from '@/lib/services/CustomerRelationshipService';
import {
  CURRENT_SUBSCRIPTION_JOIN,
  effectiveStatusSql,
  isEffectivelyExpiredSql,
  personHasEffectiveActiveSql,
} from './currentSubscription';

const url = process.env.MYSQL_TEST_URL;

// Pessoas de teste
const RETURNING = 1;      // cancelada + anual expirada + recorrente vigente (caso Estefanía)
const STALE_ACTIVE = 2;   // status 'active' com vigência vencida (core não atualizou)
const ONLY_PENDING = 3;   // só tentativa não paga
const CANCELED_LAST = 4;  // foi cliente, a mais recente está cancelada
const NO_END_DATE = 5;    // ativa sem data de fim
const NO_SUBS = 6;        // nunca assinou

describe.skipIf(!url)('assinatura atual (MySQL real)', () => {
  let db: mysql.Connection;

  const currentOf = async (personId: number) => {
    const [rows] = await db.query<any[]>(
      `SELECT s.id AS subId, ${effectiveStatusSql('s')} AS status
       FROM people p ${CURRENT_SUBSCRIPTION_JOIN}
       WHERE p.id = ?`,
      [personId],
    );
    expect(rows).toHaveLength(1); // nunca mais de uma linha por pessoa
    return rows[0];
  };

  beforeAll(async () => {
    db = await mysql.createConnection({ uri: url, multipleStatements: true });
    await db.query(`
      DROP TABLE IF EXISTS subscriptions; DROP TABLE IF EXISTS people;
      CREATE TABLE people (id INT PRIMARY KEY, fullName VARCHAR(100), admin TINYINT DEFAULT 0, createdAt DATETIME DEFAULT NOW());
      CREATE TABLE subscriptions (
        id INT PRIMARY KEY, personId INT, planId INT, status VARCHAR(20),
        createdAt DATETIME, canceledAt DATETIME NULL, isValidUntil DATETIME NULL, expiresIn DATETIME NULL,
        INDEX (personId)
      );
      INSERT INTO people (id, fullName) VALUES (1,'Retornou'),(2,'Ativa vencida'),(3,'So pendente'),(4,'Cancelou por ultimo'),(5,'Sem data fim'),(6,'Nunca assinou');
      INSERT INTO subscriptions VALUES
        (28458, 1, 288, 'canceled', '2025-10-09 10:00', '2025-10-09 11:00', NULL, NULL),
        (28459, 1,  86, 'expired',  '2025-10-09 10:05', NULL, '2026-10-09', NULL),
        (37204, 1, 262, 'active',   DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, DATE_ADD(CURDATE(), INTERVAL 30 DAY), NULL),
        (200,   2, 262, 'active',   '2025-01-01', NULL, DATE_SUB(CURDATE(), INTERVAL 10 DAY), NULL),
        (300,   3, 262, 'pending',  '2026-09-01', NULL, NULL, NULL),
        (400,   4,  86, 'expired',  '2024-01-01', NULL, '2025-01-01', NULL),
        (401,   4, 262, 'canceled', '2025-06-01', '2025-08-01', NULL, NULL),
        (500,   5, 999, 'active',   '2024-05-01', NULL, NULL, NULL);
    `);
  });

  afterAll(async () => {
    await db?.end();
  });

  it('cliente que voltou: vale a assinatura vigente, não a primeira do histórico', async () => {
    const cur = await currentOf(RETURNING);
    expect(cur).toEqual({ subId: 37204, status: 'active' });
    expect(CustomerRelationshipService.classify({ subscriptionStatus: cur.status })).toBe('CUSTOMER');
  });

  it("'active' com vigência vencida é expirada", async () => {
    expect(await currentOf(STALE_ACTIVE)).toEqual({ subId: 200, status: 'expired' });
  });

  it('pendente não conta como assinatura', async () => {
    expect((await currentOf(ONLY_PENDING)).subId).toBeNull();
  });

  it('sem nenhuma vigente, vale a mais recente', async () => {
    const cur = await currentOf(CANCELED_LAST);
    expect(cur).toEqual({ subId: 401, status: 'canceled' });
    expect(CustomerRelationshipService.classify({ subscriptionStatus: cur.status })).toBe('FORMER_CUSTOMER');
  });

  it('ativa sem data de fim é vigente', async () => {
    expect(await currentOf(NO_END_DATE)).toEqual({ subId: 500, status: 'active' });
  });

  it('quem nunca assinou fica sem assinatura atual', async () => {
    expect((await currentOf(NO_SUBS)).subId).toBeNull();
  });

  it('fila de cancelados não inclui quem renovou', async () => {
    const [rows] = await db.query<any[]>(
      `SELECT p.id FROM people p ${CURRENT_SUBSCRIPTION_JOIN}
       WHERE (s.status = 'canceled' OR s.canceledAt IS NOT NULL) ORDER BY p.id`,
    );
    expect(rows.map(r => r.id)).toEqual([CANCELED_LAST]);
  });

  it('filtro de campanha "expirado" não inclui quem é cliente vigente', async () => {
    const [rows] = await db.query<any[]>(
      `SELECT DISTINCT s.personId AS id FROM subscriptions s
       WHERE ${isEffectivelyExpiredSql('s')} AND NOT ${personHasEffectiveActiveSql('s.personId')}
       ORDER BY s.personId`,
    );
    expect(rows.map(r => r.id)).toEqual([STALE_ACTIVE, CANCELED_LAST]);
  });

  it('filtro de campanha "cancelado" não inclui quem renovou', async () => {
    const [rows] = await db.query<any[]>(
      `SELECT DISTINCT s.personId AS id FROM subscriptions s
       WHERE s.status = 'canceled' AND NOT ${personHasEffectiveActiveSql('s.personId')}
       ORDER BY s.personId`,
    );
    expect(rows.map(r => r.id)).toEqual([CANCELED_LAST]);
  });
});
