import { LegacyOpportunityMigrationService } from '../src/lib/application/LegacyOpportunityMigrationService';

async function main() {
  const apply = process.argv.includes('--apply');
  const usersArg = process.argv.find(argument => argument.startsWith('--users='));
  const names = (usersArg?.slice('--users='.length) || 'thais,jucelia')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);

  const result = await LegacyOpportunityMigrationService.restoreForAgentNames(names, apply);
  console.log(JSON.stringify(result, null, 2));
  if (!apply) console.log('\nPREVIEW concluído. Execute novamente com --apply para efetivar somente os casos seguros.');
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
