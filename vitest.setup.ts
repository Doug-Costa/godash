// Testes não consultam o MySQL do DentalGO para a lista de telefones genéricos.
// Quem precisa da lista define a sua com setGenericPhonesProvider().
import { setGenericPhonesProvider } from './src/lib/identity/genericPhones';

setGenericPhonesProvider(async () => new Set());
