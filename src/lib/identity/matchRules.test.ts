import { describe, expect, it } from 'vitest';
import {
  compareNames,
  decideAgainstCandidates,
  isNearEmail,
  isValidCpf,
  matchIdentities,
  type IdentitySignals,
} from './matchRules';

const signals = (s: Partial<IdentitySignals>): IdentitySignals => ({ names: [], emails: [], phones: [], ...s });

// Douglas canônico (FATO: DentalGO/ERP)
const DOUGLAS = signals({
  names: ['Douglas Henrique Costa Eugenio'],
  emails: ['douglas.costa@gmail.com', 'douglas.henrique@gmail.com'],
  phones: ['(44) 98876-2228'],
  cpf: '529.982.247-25',
});

describe('nomes', () => {
  it.each([
    'Douglas Costa',
    'Douglas Henrique',
    'Douglas Eugenio',
    'Douglas H.C Eugenio',
    'Dr. Douglas H. C.',
    'DOUGLAS COSTA EUGÊNIO',
    'Douglas Henriquue',
  ])('"%s" é compatível com o nome completo', variante => {
    expect(compareNames([variante], ['Douglas Henrique Costa Eugenio'])).toBe('COMPATIBLE');
  });

  it('familiares com mesmo sobrenome NÃO são compatíveis', () => {
    expect(compareNames(['Ana Costa'], ['Pedro Costa'])).toBe('INCOMPATIBLE');
  });

  it('xarás com sobrenomes diferentes NÃO são compatíveis', () => {
    expect(compareNames(['Ana Paula Costa'], ['Ana Beatriz Lima'])).toBe('INCOMPATIBLE');
  });

  it('primeiro nome com uma letra diferente NÃO é compatível', () => {
    expect(compareNames(['Mariana Costa'], ['Mariane Costa'])).toBe('INCOMPATIBLE');
  });

  it('nome ausente ou genérico é desconhecido', () => {
    expect(compareNames(['Lead DentalGO #7509'], ['Douglas Costa'])).toBe('UNKNOWN');
    // Nomes genéricos gravados pelo importador Bitrix quando o contato vem sem nome
    expect(compareNames(['Contato Sem Nome'], ['Douglas Costa'])).toBe('UNKNOWN');
    expect(compareNames(['Contato Recuperado'], ['Douglas Costa'])).toBe('UNKNOWN');
    // O genérico é ignorado e os nomes reais da mesma ficha continuam valendo
    expect(compareNames(['Contato Recuperado', 'Douglas Costa'], ['Douglas Henrique Costa'])).toBe('COMPATIBLE');
    expect(compareNames([], ['Douglas Costa'])).toBe('UNKNOWN');
  });
});

describe('regra 1 — junta automaticamente: e-mail igual + nome compatível', () => {
  it('formulário "Excelência em Orto" com douglas.costa@ junta no Douglas', () => {
    const form = signals({ names: ['Douglas Costa'], emails: ['Douglas.Costa@gmail.com '] });
    expect(matchIdentities(form, DOUGLAS).decision).toBe('AUTO_MERGE');
  });

  it('e-mail igual sem nome NÃO junta sozinho', () => {
    const csv = signals({ emails: ['douglas.costa@gmail.com'] });
    expect(matchIdentities(csv, DOUGLAS).decision).toBe('REVIEW');
  });
});

describe('regra 2 — mesmo contato, nome muito diferente → revisão', () => {
  it('e-mail da clínica usado por dois dentistas', () => {
    const a = signals({ names: ['Maria Silva'], emails: ['contato@clinicasorriso.com.br'] });
    const b = signals({ names: ['João Pereira'], emails: ['contato@clinicasorriso.com.br'] });
    const r = matchIdentities(a, b);
    expect(r.decision).toBe('REVIEW');
    expect(r.evidences).toContain('NAME_INCOMPATIBLE');
  });

  it('familiares com o e-mail da clínica não se juntam', () => {
    const a = signals({ names: ['Ana Costa'], emails: ['clinica.costa@gmail.com'] });
    const b = signals({ names: ['Pedro Costa'], emails: ['clinica.costa@gmail.com'] });
    expect(matchIdentities(a, b).decision).toBe('REVIEW');
  });

  it('número reciclado pela operadora', () => {
    const novoDono = signals({ names: ['Carla Mendes'], phones: ['44988762228'] });
    expect(matchIdentities(novoDono, DOUGLAS).decision).toBe('REVIEW');
  });
});

describe('regra 3 — telefone igual → revisão, mesmo com nome compatível', () => {
  it('Douglas pelo celular, sem e-mail', () => {
    const r = matchIdentities(signals({ names: ['Douglas Costa'], phones: ['+5544988762228'] }), DOUGLAS);
    expect(r.decision).toBe('REVIEW');
    expect(r.evidences).toContain('PHONE_EXACT');
  });

  it('telefone fictício não conta', () => {
    const r = matchIdentities(signals({ names: ['Douglas Costa'], phones: ['(44) 99999-9999'] }),
      signals({ names: ['Douglas Costa'], phones: ['44999999999'] }));
    expect(r.decision).toBe('DISTINCT');
  });
});

describe('regra 4 — e-mail quase igual + nome compatível → revisão', () => {
  it('formulário "Orto Infantil" com douglas.hneriuque@ (erro de digitação)', () => {
    const form = signals({ names: ['Douglas Henriquue'], emails: ['douglas.hneriuque@gmail.com'] });
    const r = matchIdentities(form, DOUGLAS);
    expect(r.decision).toBe('REVIEW');
    expect(r.evidences).toContain('EMAIL_NEAR');
    expect(r.evidences).toContain('NAME_COMPATIBLE');
  });

  it('e-mails parecidos de domínios diferentes não contam', () => {
    expect(isNearEmail('douglas.costa@gmail.com', 'douglas.costa@hotmail.com')).toBe(false);
  });

  it('partes locais curtas não contam (ana@ × ane@)', () => {
    expect(isNearEmail('ana@gmail.com', 'ane@gmail.com')).toBe(false);
  });
});

describe('regra 5 — CPF ajuda, mas não é regra', () => {
  it('CPF igual sozinho vai para revisão (não junta)', () => {
    const r = matchIdentities(signals({ names: ['Douglas Costa'], cpf: '52998224725' }), DOUGLAS);
    expect(r.decision).toBe('REVIEW');
    expect(r.evidences).toContain('CPF_EXACT');
  });

  it('CPF diferente bloqueia a junção mesmo com e-mail e nome iguais', () => {
    const outro = signals({ names: ['Douglas Costa'], emails: ['douglas.costa@gmail.com'], cpf: '111.444.777-35' });
    const r = matchIdentities(outro, DOUGLAS);
    expect(r.decision).toBe('REVIEW');
    expect(r.blockers).toContain('CPF_DIFFERENT');
  });

  it('CPF ausente não atrapalha', () => {
    const form = signals({ names: ['Douglas Costa'], emails: ['douglas.costa@gmail.com'] });
    expect(matchIdentities(form, DOUGLAS).decision).toBe('AUTO_MERGE');
  });

  it('valida dígito verificador', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('52998224724')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
  });
});

describe('regra 7 — só o nome nunca gera candidato', () => {
  it('outro Douglas da base, sem contato em comum', () => {
    const outroDouglas = signals({ names: ['Douglas Costa'], emails: ['dcosta@empresa.com'] });
    expect(matchIdentities(outroDouglas, DOUGLAS).decision).toBe('DISTINCT');
  });
});

describe('regra 6 — vários candidatos: na dúvida, não junta', () => {
  const douglasA = { id: 'A', signals: DOUGLAS };
  const douglasB = { id: 'B', signals: signals({ names: ['Douglas Costa'], phones: ['44991112222'] }) };

  it('um único candidato qualificado → junta nele', () => {
    const form = signals({ names: ['Douglas Costa'], emails: ['douglas.costa@gmail.com'] });
    const r = decideAgainstCandidates(form, [douglasA]);
    expect(r.decision).toBe('AUTO_MERGE');
    expect(r.target?.id).toBe('A');
  });

  it('e-mail aponta para A e telefone para B → revisão', () => {
    const form = signals({ names: ['Douglas Costa'], emails: ['douglas.costa@gmail.com'], phones: ['44991112222'] });
    const r = decideAgainstCandidates(form, [douglasA, douglasB]);
    expect(r.decision).toBe('REVIEW');
    expect(r.reviewCandidates.map(c => c.candidate.id).sort()).toEqual(['A', 'B']);
  });
});
