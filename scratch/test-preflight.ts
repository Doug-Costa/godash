import { ImportPreflightService } from '../src/lib/services/ImportPreflightService';

const mockCsv = `schema_version,name,email,phone,product_name,fact_type,value,occurred_at
v4-canonical,Joao Teste,joao@teste.com,5511999999999,Aperfeicoamento Ortodontia,PURCHASE,1500,2026-08-17
v4-canonical,Maria Lead,,5511888888888,,LEAD_CAPTURE,,
v4-canonical,Erro Fato,erro@teste.com,5511777777777,,COMPRA_ERRADA,0,
v4-canonical,Sem Valor,semvalor@teste.com,5511666666666,Aperfeicoamento Ortodontia,PURCHASE,,
`;

async function run() {
  try {
    const summary = await ImportPreflightService.analyzeCsv(mockCsv);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error(error);
  }
}

run();
