import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./CanonicalIdentityService', () => ({
  CanonicalIdentityService: { inspect: vi.fn() }
}));

vi.mock('./ProductResolverService', () => ({
  ProductResolverService: { resolve: vi.fn() }
}));

vi.mock('./ImportDuplicateInspectionService', () => ({
  ImportDuplicateInspectionService: { purchaseExists: vi.fn() }
}));

import { CanonicalIdentityService } from './CanonicalIdentityService';
import { ProductResolverService } from './ProductResolverService';
import { ImportDuplicateInspectionService } from './ImportDuplicateInspectionService';
import { ImportPreflightService } from './ImportPreflightService';

const HEADER = 'Código,Data Cadastro,Cliente,Edição Inicial,Descrição,EMAIL_FISCAL,EMAIL,Telefone Comercial,Telefone Residencial,Vendedor Contrato,Vendedor Cliente,Produto,Cód.Curso,Curso,Status';

describe('ImportPreflightService', () => {
  beforeEach(() => {
    vi.mocked(CanonicalIdentityService.inspect).mockResolvedValue({ status: 'NOT_FOUND' });
    vi.mocked(ProductResolverService.resolve).mockResolvedValue({
      status: 'FOUND',
      productId: 'course_44',
      productName: 'Especialização em Endodontia'
    });
    vi.mocked(ImportDuplicateInspectionService.purchaseExists).mockResolvedValue(false);
  });

  it('ignora a linha vazia exportada antes do cabeçalho real', async () => {
    const csv = [
      ',,,,,,,,,,,,,,',
      HEADER,
      ['26844', '8/30/2019', '944472/FRANCIELI RIBEIRO DE BRITO', '',
        'CURSOS / ESPECIALIZACAO EM ENDODONTIA', 'franedir2@gmail.com',
        'franedir2@gmail.com', '(44)99824-0966', '', '291/0008', '380/0009',
        '', '44', 'ESPECIALIZACAO EM ENDODONTIA', '24/ATIVA'].join(',')
    ].join('\r\n');

    const summary = await ImportPreflightService.analyzeCsv(csv);

    expect(summary.totalRows).toBe(1);
    expect(summary.errorRows).toBe(0);
    expect(summary.results[0].parsedData).toMatchObject({
      name: 'FRANCIELI RIBEIRO DE BRITO',
      email: 'franedir2@gmail.com',
      phone: '(44)99824-0966',
      externalPersonId: 944472,
      source_record_id: '26844',
      product_id: '44',
      enrollmentStatus: 'ACTIVE',
      occurred_at: '2019-08-30T00:00:00.000Z'
    });
  });

  it('preserva o status cancelado para o commit não confirmar a matrícula', async () => {
    const csv = [
      HEADER,
      ['26921', '9/3/2019', '922421/LARISSA CRACO SEHNEM', '', '',
        'larissa@example.com', 'larissa@example.com', '', '', '', '', '',
        '44', 'ENDODONTIA', '37/CANCELADO'].join(',')
    ].join('\n');

    const summary = await ImportPreflightService.analyzeCsv(csv);

    expect(summary.results[0].parsedData?.enrollmentStatus).toBe('CANCELED');
    expect(summary.results[0].parsedData?.source_record_id).toBe('26921');
  });

  it('preserva a identidade completa dos alunos de DTM', async () => {
    const csv = [
      HEADER,
      ['23165', '8/31/2026', '231651/ROBERTO HENRIQUE DA COSTA GREC', '', '',
        'betogrec@yahoo.com.br', 'betogrec@yahoo.com.br', '(43)03339-5655', '', '', '', '',
        '123', 'APERFEICOAMENTO EM DTM', '24/ATIVA'].join(',')
    ].join('\n');

    const summary = await ImportPreflightService.analyzeCsv(csv);

    expect(summary.results[0].parsedData).toMatchObject({
      externalPersonId: 231651,
      name: 'ROBERTO HENRIQUE DA COSTA GREC',
      email: 'betogrec@yahoo.com.br',
      phone: '(43)03339-5655',
      product_name: 'APERFEICOAMENTO EM DTM'
    });
  });

  it('usa o telefone residencial quando o comercial é apenas zeros', async () => {
    const csv = [
      HEADER,
      ['23165', '8/31/2026', '231651/ROBERTO TESTE', '', '', 'roberto@example.com',
        'roberto@example.com', '(00)0000-0000', '(43)3339-5655', '', '', '',
        '123', 'APERFEICOAMENTO EM DTM', '24/ATIVA'].join(',')
    ].join('\n');

    const summary = await ImportPreflightService.analyzeCsv(csv);

    expect(summary.results[0].parsedData?.phone).toBe('(43)3339-5655');
  });

  it('avisa quando o contato e a mesma compra já existem', async () => {
    vi.mocked(CanonicalIdentityService.inspect).mockResolvedValue({ status: 'FOUND', personId: 'person_1' });
    vi.mocked(ImportDuplicateInspectionService.purchaseExists).mockResolvedValue(true);
    const csv = [
      HEADER,
      ['41754', '7/1/2022', '946274/GLAUCE AKEMI KIARA', '', 'CURSOS / EXCELENCIA EM ALINHADORES',
        'glauak@icloud.com', 'glauak@icloud.com', '(11)05096-5949', '', '', '', '',
        '90', 'EXCELENCIA EM ALINHADORES', '37/CANCELADO'].join(',')
    ].join('\n');

    const summary = await ImportPreflightService.analyzeCsv(csv);

    expect(summary.warningRows).toBe(1);
    expect(summary.results[0].warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('Contato já existente'),
      expect.stringContaining('Compra já existente')
    ]));
  });

  it('aceita mapeamento confirmado sem carregar colunas desconhecidas', async () => {
    const csv = [
      'Doutor;Celular 1;CNPJ da Clinica;Curso Comprado;Situacao;Valor Pago',
      'MARIA SOUZA;11988887777;12.345.678/0001-00;ENDODONTIA;ATIVA;R$ 1.250,90'
    ].join('\n');

    const summary = await ImportPreflightService.analyzeCsv(csv, {
      Doutor: 'name',
      'Celular 1': 'phone',
      'CNPJ da Clinica': 'IGNORE',
      'Curso Comprado': 'product_name',
      Situacao: 'fact_status',
      'Valor Pago': 'value'
    });

    expect(summary.results[0].originalData).not.toHaveProperty('CNPJ da Clinica');
    expect(summary.results[0].parsedData?.value).toBe(1250.9);
  });
});
