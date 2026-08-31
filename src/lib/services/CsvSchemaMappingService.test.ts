import { describe, expect, it } from 'vitest';
import { CsvSchemaMappingService } from './CsvSchemaMappingService';

describe('CsvSchemaMappingService', () => {
  it('detecta ponto e vírgula e ignora campos ambíguos ou desconhecidos', () => {
    const csv = [
      'Nome do Aluno;WhatsApp;ID2;ID Fiscal;CNPJ da Clinica;Nome Curso;Situacao Matricula',
      'Ana Silva;11999999999;ABC;998;12.345.678/0001-00;Endodontia;ATIVA'
    ].join('\n');

    const inspection = CsvSchemaMappingService.inspect(csv);
    const suggestions = Object.fromEntries(inspection.columns.map(column => [column.header, column.suggestedTarget]));

    expect(inspection.delimiter).toBe(';');
    expect(suggestions).toMatchObject({
      'Nome do Aluno': 'name',
      WhatsApp: 'phone',
      ID2: 'IGNORE',
      'ID Fiscal': 'IGNORE',
      'CNPJ da Clinica': 'IGNORE',
      'Nome Curso': 'product_name',
      'Situacao Matricula': 'fact_status'
    });
  });

  it('só entrega campos canônicos escolhidos e normaliza datas por coluna', () => {
    const csv = [
      'Pessoa;Data;CNPJ;Valor Pago',
      'Ana;31/08/2026;12.345.678/0001-00;R$ 1.250,90'
    ].join('\n');
    const parsed = CsvSchemaMappingService.parse(csv);
    const rows = CsvSchemaMappingService.applyMapping(parsed.rows, {
      Pessoa: 'name',
      Data: 'occurred_at',
      CNPJ: 'IGNORE',
      'Valor Pago': 'value'
    });

    expect(rows[0]).toEqual({
      name: 'Ana',
      occurred_at: '2026-08-31T00:00:00.000Z',
      value: 'R$ 1.250,90'
    });
    expect(rows[0]).not.toHaveProperty('CNPJ');
  });

  it('reconhece datas M/D quando a coluna contém dias maiores que 12 na segunda posição', () => {
    const csv = ['Data Cadastro', '7/22/2019', '8/30/2019'].join('\n');
    const parsed = CsvSchemaMappingService.parse(csv);
    const rows = CsvSchemaMappingService.applyMapping(parsed.rows, { 'Data Cadastro': 'occurred_at' });
    expect(rows[0].occurred_at).toBe('2019-07-22T00:00:00.000Z');
  });
});
