# Análise DentalGO Production
> Banco: **dentalgo_production** | Gerado: 30/06/2026, 10:28:43

## 1. TABELAS DO BANCO

| Tables_in_dentalgo_production |
| --- |
| addresses |
| author_resumes |
| authors |
| banners |
| collections |
| collections_products_products |
| countries |
| coupons |
| customers |
| email_templates |
| favorite_product_items |
| filiateds |
| filiation_access |
| filiation_balance_monetizations |
| filiation_balances |
| filiation_purchases |
| filiation_requests |
| filiation_subscription_months |
| filiation_subscriptions |
| filiations |
| import_csv_rows |
| import_csvs |
| integration_plans |
| integration_product_items |
| iugu_sub_accounts |
| keywords |
| keywords_product_items_product_items |
| keywords_products_products |
| migrations |
| monetary_quotes |
| outstanding_balances |
| payment_profiles |
| people |
| person_coupons |
| plan_products |
| plans |
| plans_collections_collections |
| product_infos |
| product_items |
| product_items_authors_authors |
| product_items_keywords_keywords |
| products |
| products_authors_authors |
| products_keywords_keywords |
| purchase_items |
| purchase_refunds |
| purchases |
| states |
| subscriptions |
| system_parameters |
| tokens |
| transfers |
| usage_terms |
| video_watchs |

_54 registro(s)_

## 2. ESTRUTURA: plans

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| id | int(11) | NO | PRI | NULL | auto_increment |
| createdAt | datetime | NO |  | NULL |  |
| updatedAt | datetime | NO |  | NULL |  |
| intervalCount | int(11) | NO |  | NULL |  |
| cycles | int(11) | YES |  | NULL |  |
| billingTriggerDay | int(11) | NO |  | NULL |  |
| status | tinyint(4) | NO |  | 0 |  |
| billingTriggerType | enum('beginning_of_period','end_of_period','day_of_month') | NO |  | NULL |  |
| intervalType | enum('months','days') | NO |  | NULL |  |
| title | varchar(255) | NO |  |  |  |
| description | longtext | YES |  | NULL |  |
| price | int(11) | NO |  | 0 |  |
| payableWith | enum('all','credit_card','bank_slip','pix') | NO |  | NULL |  |
| monetizationForFiliations | tinyint(4) | NO |  | 0 |  |
| isManualPayment | tinyint(4) | NO |  | 0 |  |
| requiresAddress | tinyint(4) | NO |  | 0 |  |

_16 registro(s)_

## 3. TODOS OS PLANOS (plans)

| id | title | price  1 | intervalType |
| --- | --- | --- | --- |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |
|  | Editar | Copiar | Remover |

_100 registro(s)_

## 4. ESTRUTURA: people

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| id | int(11) | NO | PRI | NULL | auto_increment |
| createdAt | datetime | NO |  | NULL |  |
| updatedAt | datetime | NO |  | NULL |  |
| fullName | varchar(255) | NO |  |  |  |
| photoURL | varchar(255) | NO |  |  |  |
| email | varchar(255) | NO | UNI | NULL |  |
| password | varchar(255) | YES |  |  |  |
| phoneNumber | varchar(255) | NO |  |  |  |
| admin | tinyint(4) | NO |  | 0 |  |
| documentNumber | varchar(255) | NO |  |  |  |
| scope | varchar(255) | NO | MUL |  |  |

_11 registro(s)_

## 5. ESTRUTURA: subscriptions

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| id | int(11) | NO | PRI | NULL | auto_increment |
| createdAt | datetime | NO |  | NULL |  |
| updatedAt | datetime | NO |  | NULL |  |
| startAt | datetime | NO |  | current_timestamp() |  |
| expiresIn | datetime | YES |  | NULL |  |
| status | enum('active','canceled','expired') | NO |  | NULL |  |
| overdue | tinyint(4) | NO |  | 0 |  |
| paymentMethod | enum('credit_card') | NO |  | NULL |  |
| paymentGateway | enum('vindi','iugu','manual') | NO |  | NULL |  |
| personId | int(11) | YES | MUL | NULL |  |
| planId | int(11) | YES | MUL | NULL |  |
| canceledAt | datetime | YES |  | NULL |  |
| externalId | varchar(255) | NO |  | NULL |  |
| isValidUntil | datetime | YES |  | NULL |  |
| discountIntegrationPlanId | int(11) | YES | MUL | NULL |  |

_15 registro(s)_

## 6. ESTRUTURA: products

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| id | int(11) | NO | PRI | NULL | auto_increment |
| createdAt | datetime | NO |  | NULL |  |
| updatedAt | datetime | NO |  | NULL |  |
| title | varchar(255) | YES |  |  |  |
| cover | varchar(255) | YES |  |  |  |
| customerCourtesy | tinyint(4) | NO |  | 0 |  |
| subscriberCourtesy | tinyint(4) | NO |  | 0 |  |
| category | varchar(255) | YES |  |  |  |
| length | int(11) | NO |  | 0 |  |
| itemsQuantityPerLanguage | int(11) | NO |  | 0 |  |
| status | tinyint(4) | NO |  | 0 |  |
| digitalProduct | tinyint(4) | NO |  | 1 |  |
| availableLanguages | set('pt','en','es') | YES |  | NULL |  |
| availableFileFormats | set('pdf','html','mp4','mov','xml') | YES |  | NULL |  |
| productType | enum('book','course','video','magazine','divulgation') | YES |  | NULL |  |
| brief | longtext | YES |  | NULL |  |
| price | int(11) | NO |  | 0 |  |
| publishDate | datetime | YES |  | NULL |  |
| monetizationForFiliations | tinyint(4) | NO |  | 0 |  |
| internalCode | varchar(255) | YES |  | NULL |  |

_20 registro(s)_

## 7. ESTRUTURA: purchases

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| id | int(11) | NO | PRI | NULL | auto_increment |
| createdAt | datetime | NO |  | NULL |  |
| updatedAt | datetime | NO |  | NULL |  |
| paymentGatewayType | enum('vindi','iugu','manual') | NO |  | NULL |  |
| personId | int(11) | YES | MUL | NULL |  |
| personCouponId | int(11) | YES | UNI | NULL |  |
| externalId | varchar(255) | YES |  | NULL |  |
| total | int(10) unsigned | NO |  | NULL |  |
| status | enum('success','canceled') | NO |  | NULL |  |
| refundId | int(11) | YES | UNI | NULL |  |

_10 registro(s)_

## 8. RESUMO GERAL (contagens)

| total_clientes | subs_ativas | subs_canceladas | total_planos | total_produtos | compras_ok |
| --- | --- | --- | --- | --- | --- |
| 38832 | 5934 | 11892 | 288 | 926 | 3358 |

_1 registro(s)_

## 9. STATUS em subscriptions

| status | qtd  1 |
| --- | --- |
| expired | 17944 |
| canceled | 11892 |
| active | 5934 |

_3 registro(s)_

## 10. PLANOS × ASSINANTES

| id | title | price | intervalType | total_assinantes | ativos  1 | cancelados |
| --- | --- | --- | --- | --- | --- | --- |
| 290 | SLM - São Leopoldo Mandic | 1 | months | 10261 | 2837 | 321 |
| 275 | JBCOMS | 1 | months | 1972 | 798 | 428 |
| 273 | Scholar Ária | 1 | months | 1848 | 455 | 399 |
| 263 | SOBRAPI | 1 | months | 1529 | 431 | 221 |
| 291 | SLM Professores | 1 | months | 233 | 228 | 5 |
| 279 | SBTI | 1 | months | 1273 | 206 | 715 |
| 88 | DentalGo Anual R$58,00 | 5800 | months | 1456 | 193 | 486 |
| 87 | DentalGo Anual R$ 68,00 | 6800 | months | 681 | 146 | 236 |
| 94 | Cortesia Alunos Especializações | 0 | months | 687 | 121 | 208 |
| 280 | Fabiano Marson - DentalGO | 1 | months | 188 | 78 | 55 |
| 86 | Dental GO Anual R$78,00 | 7800 | months | 254 | 65 | 64 |
| 95 | Cortesia Dental Press | 0 | months | 984 | 52 | 172 |
| 262 | Dental GO Recorrente - R$ 89,00 | 8900 | months | 907 | 46 | 78 |
| 303 | Instituto Capelozza | 1 | months | 44 | 44 | 0 |
| 136 | DentalGO Cortesia | 0 | months | 120 | 44 | 16 |
| 102 | Cortesia Professores | 7800 | months | 149 | 30 | 20 |
| 104 | Cortesia Autores | 7800 | months | 81 | 22 | 17 |
| 274 | 15 Dias Gratis | 1 | months | 141 | 18 | 9 |
| 283 | Dental GO Anual R$89,00 | 8900 | months | 22 | 11 | 1 |
| 281 | SEOC | 1 | months | 1518 | 9 | 981 |
| 272 | Scholar Smile | 2500 | months | 29 | 8 | 2 |
| 10 | DentalGO Internacional - R$ 78,00 | 7800 | months | 152 | 7 | 142 |
| 276 | Sociedade Boliviana de Ortodontia | 1 | months | 152 | 6 | 146 |
| 20 | Dental Press DentalGO Promocional - R$ 48,00 | 4800 | months | 103 | 6 | 97 |
| 1 | DentalGO | 7800 | months | 585 | 5 | 580 |

_25 registro(s)_

## 11. PRODUTOS (completo)

| id  1 | createdAt | updatedAt | title | cover | customerCourtesy | subscriberCourtesy | category | length | itemsQuantityPerLanguage | status | digitalProduct | availableLanguages | availableFileFormats | productType | brief | price | publishDate | monetizationForFiliations | internalCode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Editar | Copiar | Remover | 1 | 2021-01-07 13:10:53 | 2025-11-28 21:00:14 | Reabsorções Dentárias nas Especialidades Clínicas | https://cloud.dentalgo.com.br/storage/2021/6/24/36... | 0 | 0 |  | 816 | 0 | 1 | 1 | pt | pdf | book | As reabsorções representam a principal causa da pe... |
|  | Editar | Copiar | Remover | 2 | 2021-01-07 13:19:23 | 2025-11-28 21:00:01 | Ortodontia Clínica e Biomecânica | https://cloud.dentalgo.com.br/storage/2021/6/24/f0... | 0 | 0 |  | 608 | 0 | 1 | 1 | pt | pdf | book | A Odontologia atravessa uma fase de enorme progres... |
|  | Editar | Copiar | Remover | 3 | 2021-01-07 13:23:40 | 2025-11-28 20:59:47 | ABOR: 25 anos de união e defesa da Ortodontia bras... | https://cloud.dentalgo.com.br/storage/2021/6/24/d0... | 0 | 1 |  | 333 | 0 | 1 | 1 | pt | pdf | book | Esta obra celebra os 25 anos da Associação Brasile... |
|  | Editar | Copiar | Remover | 4 | 2021-01-07 13:26:37 | 2025-11-28 20:59:24 | Técnica Straight-Wire Simplificada | https://cloud.dentalgo.com.br/storage/2021/6/24/43... | 0 | 0 |  | 556 | 0 | 1 | 1 | pt | pdf | book | Contando com uma experiência de 10 anos, durante o... |
|  | Editar | Copiar | Remover | 5 | 2021-01-07 13:32:04 | 2026-01-16 18:46:01 | O Ser Professor | https://cloud.dentalgo.com.br/storage/2021/6/24/df... | 0 | 0 |  | 255 | 0 | 1 | 1 | pt | pdf | book | Este livro nos leva a uma perspectiva completament... |
|  | Editar | Copiar | Remover | 6 | 2021-01-07 13:33:15 | 2026-01-16 18:46:59 | Ortodontia Preventiva e Interceptora: Mito ou Real... | https://cloud.dentalgo.com.br/storage/2021/6/24/8b... | 0 | 0 |  | 568 | 0 | 1 | 1 | pt | pdf | book | Esse livro é o produto do trabalho árduo de muitas... |
|  | Editar | Copiar | Remover | 32 | 2021-01-07 14:09:49 | 2026-01-16 18:22:33 | Clínical 2002 v01n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/dd1... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 33 | 2021-01-07 14:10:10 | 2026-01-16 19:37:25 | Clínical 2002 v01n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/8a0... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 34 | 2021-01-07 14:10:14 | 2026-01-16 19:38:44 | Clínical 2002 v01n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/06b... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 35 | 2021-01-07 14:10:22 | 2026-01-16 19:39:12 | Clínical 2002 v01n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/58b... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 36 | 2021-01-07 14:10:45 | 2026-01-16 19:45:59 | Clínical 2002 v01n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/867... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 37 | 2021-01-07 14:11:15 | 2026-01-16 19:47:51 | Clínical 2002 v01n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/c5d... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 38 | 2021-01-07 14:12:36 | 2026-01-16 19:48:19 | Clínical 2003 v02n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/6be... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 39 | 2021-01-07 14:13:29 | 2026-01-16 19:49:45 | Clínical 2003 v02n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/0ee... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 40 | 2021-01-07 14:14:14 | 2026-01-16 19:50:15 | Clínical 2003 v02n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/336... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 41 | 2021-01-07 14:15:05 | 2026-01-16 19:50:52 | Clínical 2003 v02n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/e7f... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 42 | 2021-01-07 14:15:54 | 2026-01-16 19:51:20 | Clínical 2003 v02n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/bda... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 43 | 2021-01-07 14:17:16 | 2026-01-16 19:51:45 | Clínical 2003 v02n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/ed8... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 44 | 2021-01-07 14:18:00 | 2026-01-16 19:52:08 | Clínical 2004 v03n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/bc7... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 45 | 2021-01-07 14:19:01 | 2026-01-16 19:52:32 | Clínical 2004 v03n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/3b4... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 46 | 2021-01-07 14:20:10 | 2026-01-16 19:52:48 | Clínical 2004 v03n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/b73... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 47 | 2021-01-07 14:20:16 | 2026-01-16 19:53:37 | Clínical 2004 v03n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/8e0... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 48 | 2021-01-07 14:20:24 | 2026-01-16 19:54:05 | Clínical 2004 v03n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/d2d... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 49 | 2021-01-07 14:21:01 | 2026-01-16 19:54:58 | Clínical 2004 v03n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/764... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 50 | 2021-01-07 14:22:36 | 2026-01-16 19:55:29 | Clínical 2005 v04n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/2ba... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 51 | 2021-01-07 14:24:07 | 2026-01-16 19:55:58 | Clínical 2005 v04n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/d61... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 52 | 2021-01-07 14:24:56 | 2026-01-16 19:56:46 | Clínical 2005 v04n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/5b2... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 53 | 2021-01-07 14:26:11 | 2026-01-16 19:57:09 | Clínical 2005 v04n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/138... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 54 | 2021-01-07 14:27:39 | 2026-01-16 19:57:42 | Clínical 2005 v04n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/980... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 55 | 2021-01-07 14:28:42 | 2026-01-16 19:58:20 | Clínical 2005 v04n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/4c9... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 56 | 2021-01-07 14:30:10 | 2026-01-16 19:58:44 | Clínical 2006 v05n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/826... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 57 | 2021-01-07 14:30:15 | 2026-01-16 19:59:30 | Clínical 2006 v05n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/d6e... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 58 | 2021-01-07 14:30:31 | 2026-01-16 19:59:54 | Clínical 2006 v05n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/ce5... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 59 | 2021-01-07 14:31:22 | 2026-01-16 20:02:41 | Clínical 2006 v05n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/f08... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 60 | 2021-01-07 14:32:31 | 2026-01-16 20:03:11 | Clínical 2006 v05n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/514... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 61 | 2021-01-07 14:33:43 | 2026-01-16 20:03:32 | Clínical 2006 v05n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/407... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 62 | 2021-01-07 14:34:32 | 2026-01-16 20:03:42 | Clínical 2007 v06n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/e67... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 63 | 2021-01-07 14:35:25 | 2026-01-16 20:04:38 | Clínical 2007 v06n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/62c... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 64 | 2021-01-07 14:36:26 | 2026-01-16 20:05:02 | Clínical 2007 v06n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/3fe... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 65 | 2021-01-07 14:37:22 | 2026-01-16 20:05:41 | Clínical 2007 v06n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/598... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 66 | 2021-01-07 14:38:38 | 2026-01-16 20:06:04 | Clínical 2007 v06n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/bda... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt,en,es | pdf | magazine |  |
|  | Editar | Copiar | Remover | 67 | 2021-01-07 14:39:41 | 2026-01-16 20:06:35 | Clínical 2007 v06n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/d7a... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 68 | 2021-01-07 14:40:13 | 2026-01-16 20:06:59 | Clínical 2008 v07n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/f98... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 69 | 2021-01-07 14:40:19 | 2026-01-16 20:07:26 | Clínical 2008 v07n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/a4e... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 70 | 2021-01-07 14:40:53 | 2026-01-16 20:07:48 | Clínical 2008 v07n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/d1a... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 71 | 2021-01-07 14:41:55 | 2026-01-16 20:08:23 | Clínical 2008 v07n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/694... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 72 | 2021-01-07 14:43:21 | 2026-01-16 20:08:46 | Clínical 2008 v07n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/fcb... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 73 | 2021-01-07 14:44:20 | 2026-01-16 20:09:08 | Clínical 2008 v07n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/db8... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 74 | 2021-01-07 14:46:03 | 2026-01-16 20:09:29 | Clínical 2009 v08n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/6f5... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 75 | 2021-01-07 14:47:01 | 2026-01-16 20:09:54 | Clínical 2009 v08n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/490... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 76 | 2021-01-07 14:48:07 | 2026-01-16 20:10:15 | Clínical 2009 v08n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/266... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 77 | 2021-01-07 14:49:15 | 2026-01-16 20:10:35 | Clínical 2009 v08n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/58c... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 78 | 2021-01-07 14:50:11 | 2026-01-16 20:11:00 | Clínical 2009 v08n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/65b... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 79 | 2021-01-07 14:50:16 | 2026-01-16 20:11:24 | Clínical 2009 v08n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/b97... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 80 | 2021-01-07 14:50:29 | 2026-01-16 20:11:45 | Clínical 2010 v09n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/03e... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 81 | 2021-01-07 14:51:25 | 2026-01-16 20:12:11 | Clínical 2010 v09n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/7b5... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 82 | 2021-01-07 14:52:15 | 2026-01-16 20:12:52 | Clínical 2010 v09n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/f2c... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 83 | 2021-01-07 14:53:13 | 2026-01-16 20:13:32 | Clínical 2010 v09n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/c74... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 84 | 2021-01-07 14:55:07 | 2026-01-16 20:13:54 | Clínical 2010 v09n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/a40... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 85 | 2021-01-07 14:55:54 | 2026-01-16 20:14:30 | Clínical 2010 v09n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/fa2... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 86 | 2021-01-07 14:56:53 | 2026-01-16 20:14:55 | Clínical 2011 v10n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/e49... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 87 | 2021-01-07 14:57:54 | 2026-01-16 20:15:19 | Clínical 2011 v10n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/462... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 88 | 2021-01-07 14:58:46 | 2026-01-16 20:15:53 | Clínical 2011 v10n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/bfa... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 89 | 2021-01-07 15:00:14 | 2026-01-16 20:17:01 | Clínical 2011 v10n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/93b... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 90 | 2021-01-07 15:00:48 | 2026-01-16 20:18:23 | Clínical 2011 v10n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/660... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 91 | 2021-01-07 15:02:26 | 2026-01-16 20:18:40 | Clínical 2011 v10n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/512... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 92 | 2021-01-07 15:04:27 | 2026-01-16 20:21:46 | Clínical 2012 v11n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/83e... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 93 | 2021-01-07 15:06:40 | 2026-01-16 20:22:35 | Clínical 2012 v11n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/d38... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 94 | 2021-01-07 15:07:58 | 2026-01-16 20:22:52 | Clínical 2012 v11n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/1a3... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 95 | 2021-01-07 15:09:29 | 2026-01-16 20:23:19 | Clínical 2012 v11n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/90f... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 96 | 2021-01-07 15:10:13 | 2026-01-16 20:31:09 | Clínical 2012 v11n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/3ab... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 97 | 2021-01-07 15:10:21 | 2026-01-16 20:32:31 | Clínical 2012 v11n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/518... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 98 | 2021-01-07 15:11:13 | 2026-01-16 20:34:41 | Clínical 2013 v12n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/b0d... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 99 | 2021-01-07 15:12:25 | 2026-01-16 20:34:59 | Clínical 2013 v12n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/0cb... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 100 | 2021-01-07 15:14:19 | 2026-01-16 20:35:20 | Clínical 2013 v12n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/1bb... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 101 | 2021-01-07 15:15:30 | 2026-01-16 20:35:46 | Clínical 2013 v12n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/7fe... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 102 | 2021-01-07 15:17:18 | 2026-01-16 20:36:17 | Clínical 2013 v12n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/47f... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 103 | 2021-01-07 15:18:54 | 2026-01-16 20:36:57 | Clínical 2013 v12n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/376... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 104 | 2021-01-07 15:20:03 | 2026-01-16 20:37:18 | Clínical 2014 v13n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/665... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 105 | 2021-01-07 15:20:13 | 2026-01-16 20:37:52 | Clínical 2014 v13n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/87b... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 106 | 2021-01-07 15:20:19 | 2026-01-16 20:38:16 | Clínical 2014 v13n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/267... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 107 | 2021-01-07 15:20:33 | 2026-01-16 20:38:35 | Clínical 2014 v13n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/068... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 108 | 2021-01-07 15:21:40 | 2026-01-16 20:39:34 | Clínical 2014 v13n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/48f... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 109 | 2021-01-07 15:22:29 | 2026-01-16 20:40:02 | Clínical 2014 v13n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/5ed... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 110 | 2021-01-07 15:23:30 | 2026-01-16 20:40:52 | Clínical 2015 v14n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/ecc... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 111 | 2021-01-07 15:23:56 | 2026-01-16 20:41:41 | Clínical 2015 v14n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/09a... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 112 | 2021-01-07 15:25:15 | 2026-01-16 20:42:09 | Clínical 2015 v14n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/953... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 113 | 2021-01-07 15:25:38 | 2026-01-16 20:42:29 | Clínical 2015 v14n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/aa4... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 114 | 2021-01-07 15:26:29 | 2026-01-16 20:43:01 | Clínical 2015 v14n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/023... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 115 | 2021-01-07 15:27:22 | 2026-01-16 20:43:31 | Clínical 2015 v14n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/8fa... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 116 | 2021-01-07 15:28:06 | 2026-01-16 20:43:52 | Clínical 2016 v15n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/098... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 117 | 2021-01-07 15:29:07 | 2026-01-16 20:44:14 | Clínical 2016 v15n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/23e... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 118 | 2021-01-07 15:30:11 | 2026-01-16 20:44:45 | Clínical 2016 v15n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/a73... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 119 | 2021-01-07 15:30:16 | 2026-01-16 20:45:24 | Clínical 2016 v15n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/46c... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 120 | 2021-01-07 15:30:24 | 2026-01-16 20:46:21 | Clínical 2016 v15n5 | https://cloud.dentalgo.com.br/storage/2021/1/7/d16... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 121 | 2021-01-07 15:31:16 | 2026-01-16 20:46:44 | Clínical 2016 v15n6 | https://cloud.dentalgo.com.br/storage/2021/1/7/eae... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 122 | 2021-01-07 15:32:35 | 2026-01-16 20:47:02 | Clínical 2017 v16n1 | https://cloud.dentalgo.com.br/storage/2021/1/7/c30... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 123 | 2021-01-07 15:34:03 | 2026-01-16 20:47:22 | Clínical 2017 v16n2 | https://cloud.dentalgo.com.br/storage/2021/1/7/99a... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 124 | 2021-01-07 15:35:07 | 2026-01-16 20:47:42 | Clínical 2017 v16n3 | https://cloud.dentalgo.com.br/storage/2021/1/7/3c2... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |
|  | Editar | Copiar | Remover | 125 | 2021-01-07 15:36:00 | 2026-01-16 20:47:59 | Clínical 2017 v16n4 | https://cloud.dentalgo.com.br/storage/2021/1/7/245... | 0 | 0 |  | 0 | 1 | 1 | 1 | pt | pdf | magazine |  |

_100 registro(s)_

## 12. ESTRUTURA: purchase_items

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| id | int(11) | NO | PRI | NULL | auto_increment |
| createdAt | datetime | NO |  | NULL |  |
| updatedAt | datetime | NO |  | NULL |  |
| personId | int(11) | YES | MUL | NULL |  |
| purchaseId | int(11) | YES | MUL | NULL |  |
| productItemId | int(11) | YES | MUL | NULL |  |
| amount | int(11) | NO |  | NULL |  |

_7 registro(s)_

## 13. ESTRUTURA: product_items

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| id | int(11) | NO | PRI | NULL | auto_increment |
| createdAt | datetime | NO |  | NULL |  |
| updatedAt | datetime | NO |  | NULL |  |
| title | varchar(255) | YES |  |  |  |
| cover | varchar(255) | YES |  |  |  |
| customerCourtesy | tinyint(4) | NO |  | 0 |  |
| subscriberCourtesy | tinyint(4) | NO |  | 0 |  |
| digitalProduct | tinyint(4) | NO |  | 1 |  |
| content | varchar(255) | YES |  |  |  |
| chapterNumber | int(10) unsigned | YES |  | 0 |  |
| initialPage | int(10) unsigned | YES |  | 0 |  |
| length | int(10) unsigned | YES |  | 0 |  |
| status | tinyint(4) | NO |  | 0 |  |
| language | enum('pt','en','es') | NO |  | NULL |  |
| fileFormat | enum('pdf','html','mp4','mov','xml') | YES |  | NULL |  |
| productId | int(11) | YES | MUL | NULL |  |
| brief | longtext | YES |  | NULL |  |
| price | int(11) | NO |  | 0 |  |
| publishDate | datetime | YES |  | NULL |  |
| category | enum('Alinhadores Ortodontia Digital','Distúrbios respiratórios e a Ortodontia','Expediente','Soluções e protocolos clínicos','Editorial Inovação','Opinião de Especialista','Abstracts','Clinical Appro | YES |  | NULL |  |
| fileType | enum('video','pdf','image') | YES |  | NULL |  |
| doiLink | varchar(255) | YES |  |  |  |
| data | text | YES |  | NULL |  |
| contentText | longtext | YES |  | NULL |  |

_24 registro(s)_

## 14. COMPRADORES SEM ASSINATURA ATIVA

| id | fullName  1 | email | phoneNumber |
| --- | --- | --- | --- |
| 1133 |  | luishenrique27@hotmail.com |  |
| 4502 |  | marcos.neves@gmail.com |  |
| 4517 |  | analuisagiovannini@hotmail.com |  |
| 852 |  | luizdiasjr@hotmail.com |  |
| 1888 |  | marcio@compuland.com.br |  |
| 3766 |  | maclaros9@gmail.com |  |
| 17796 | Aaron Hager | henesaaron@gmail.com |  |
| 9097 | ABRALO | contato@abralodigital.com.br | 5511937797384 |
| 23956 | Ada Garcia | doctorsmile10@gmail.com |  |
| 32614 | Adalberto Guerrerogongora | betoguerrero29@gmail.com |  |
| 32929 | Adalis García Laguna | draadalisgarcia@gmail.com |  |
| 15326 | Adam Angerman | adamangerman@o2.pl | 48 695350239 |
| 15169 | Addah Regina da Silva Freire | freireaddah@gmail.com | 5561983835939 |
| 32658 | Adianeza Rodriguez | adianezadent@gmail.com |  |
| 15022 | Adolfo Villegas Orrantia | adolfovio6@hotmail.com |  |
| 10780 | Adrian Alvarado | draadrianalvarado@gmail.com |  |
| 21696 | ADRIANA Campos Passanezi SANTANA | drisantana@yahoo.com.br | 55 1432358366 |
| 15378 | Adriana de Alcântara Cury Saramago | adrianacury@id.uff.br |  |
| 38796 | Adriana Dos Santos Belo | adri_belo@hotmail.com | 5571992124428 |
| 14777 | Adriana Espinal | dentomedpty@gmail.com |  |
| 561 | Adriana Freitas | adrianabezerra@hotmail.com | 558532615767 |
| 22177 | Adriana Gil | titinagil@hotmail.com |  |
| 14684 | Adriana Hirschhaut | ahirschhaut@gmail.com | +58 04122852892 |
| 17097 | Adriana Mariela Galindo Mendoza | adrigalindom@yahoo.com |  |
| 15606 | Adriana Mendoza Carrillo | dra.adrianamendozac@gmail.com |  |
| 8712 | ADRIANA PARENTE NEIVA SANTOS | adrianaparentens@gmail.com | 558534581949 |
| 9701 | Adriana Paulina Cabascango Ilumiquinga | adricabas482@gmail.com | +591 997288660 |
| 630 | Adriana Soares | ajsoares@unicamp.br |  |
| 9111 | ADRIANA SOUZA DE JESUS | jesus.adrianasouza@gmail.com | 5591981777242 |
| 10973 | ADRIANA VICTOR DE BARROS | adrianavictorb1@gmail.com |  |
| 8855 | ADRIANO BARBOSA AMARAL DE OLIVEIRA | adbrasil3000@yahoo.com.br | 5531988121945 |
| 8823 | ADRIANO FRANCISCO DE LUCCA FACHOLLI | adriano@doutorpedrinho.com.br | 551532794002 |
| 14834 | Adriano Guimarães | dr.guido@terra.com.br | +55 24988187020 |
| 15953 | Aguinaldo Lopez | waltercito821@gmail.com |  |
| 10555 | Agustin Santos | agustinsantosserra@gmail.com | 507 66711254 |
| 22278 | Ahmad Suleiman Elias | asedental15@gmail.com | 593 988343154 |
| 32674 | Aida Rocha Aguilar | dra.aidaroch@gmail.com |  |
| 23899 | Aide J Rubio | aidejrubio@yahoo.com |  |
| 17828 | Airton Curi Junior | airtoncurijr@usp.br | 55 35991998899 |
| 6411 | Akkineiw Junior | akkineiw@gmail.com | 55 21991471021 |
| 19751 | Alan Benjamin Vizcaino Chontasi | alanvizcaino33@gmail.com | 593 989353668 |
| 16677 | Alan Humberto Zamora Cruz | alanzcruz.44@gmail.com |  |
| 17101 | Alan javier arellano Garca | alan.arellano.alinea@gmail.com |  |
| 23973 | Alan Saúl Morales y Mendez | asmorales.mendez@gmail.com |  |
| 8007 | ALANA CÂNDIDO PAULO | alanacandido@hotmail.com | 5583996063659 |
| 15923 | Alana Cristina Machado Lacerda | machado3alana@gmail.com | 5519999892572 |
| 16405 | Alba Marcela Muoz Villanueva | dra.munozmarcela@gmail.com |  |
| 23958 | Alba Polanco | albitapolanco@gmail.com |  |
| 32663 | Albany Uzcategui | uzcategui.ab@gmail.com |  |
| 21369 | Alberto Andrés Barrios Correa | alegarciasupra@gmail.com |  |
| 8458 | Alberto dos Santos Nascimento | dr.albertinho@yahoo.com.br | 5511971446079 |
| 15653 | ALBERTO GIMENO MONTES | albertogm91@gmail.com |  |
| 9653 | Alberto Rafael Rios Quimper | tito_riosq@hotmail.com | 992784616 |
| 15410 | Alberto Venero | albertovenero@hotmail.com |  |
| 32609 | Albor Marysol Rita | marysol_mardel@yahoo.com.ar |  |
| 9099 | ALDA SANTOS DA SILVA BASTOS | alda21para@yahoo.com.br | 5591988889015 |
| 15712 | Aldin Kapetanovic | aldin.ka@protonmail.com |  |
| 9009 | ALDO DE CASTRO ZANCHIN | aldozanchin@gmail.com | 5551991232408 |
| 15279 | Aldo Soto Flores | aldosotofl@gmail.com | 56 999096733 |
| 9054 | ALE RIBEIRO | ribeiroalexandre@uol.com.br | 5521981814551 |
| 18309 | Alefi Marques Lopes da Silva | alefi1968@gmail.com | 55 89999891139 |
| 19336 | Aleida Toribio | aleidatoribiom@gmail.com |  |
| 23959 | Alejandra arroyo | alearroyo7210@gmail.com |  |
| 16741 | Alejandra Figueroa | alexamontserrat30@gmail.com | 52 5537198231 |
| 14847 | Alejandra Illa | alejandrailla@gmail.com | 598 099895913 |
| 21365 | Alejandra Patricia Avila Mier | alejandra.p89@icloud.com |  |
| 23906 | Alejandra Rocabado | alejandra.rocabado.s@gmail.com |  |
| 15481 | Alejandro Avellaneda Nossa | aldosav2106@gmail.com |  |
| 14758 | Alejandro Barrenechea Pizarro | dr.alejandrobarrenechea@gmail.com |  |
| 9140 | ALEJANDRO DAVID AVALOS CHAVEZ | adavalosch@gmail.com | 5516981340876 |
| 9641 | Alejandro Martinez Hernandez | consultoriombdental@hotmail.com | +55 5539515843 |
| 17146 | Alejandro Montenegro Orellana | monteale77c@gmail.com |  |
| 15596 | Alejo anaya | alejoanaya@hotmail.com | 541140670253 |
| 10204 | Alessandra Barbedo | alessandrabarbedo@hotmail.com | 353 0834429809 |
| 8856 | ALESSANDRA FERREIA DA SILVA | alessandra_ferreira12@hotmail.com | 5521991410599 |
| 9126 | ALESSANDRA FERREIRA GONÇALVES MARTINELLI | agmartinelli2@hotmail.com | 5511992881838 |
| 9016 | ALESSANDRA TORRES DO PRADO FERRARI | alessandra@clinicmo.com.br | 5511942018024 |
| 33134 | Alessandro Lorenzi | alesandro@clindoc.com.br | 55 53981260271 |
| 16088 | Alex castillo lira | alexcastlira84@hotmail.com |  |
| 19357 | Alex Rodríguez Ma Tay | arodmatay@gmail.com |  |
| 15139 | Alexander Calderón Javo | javich300980@gmail.com |  |
| 23972 | Alexandra Patricia De Castilla Molina | patriortodoncia@gmail.com |  |
| 23910 | Alexandra Urena | alexau27alexau27@hotmail.com |  |
| 8960 | ALEXANDRE ANTONIO RIBEIRO | alexandrear23@hotmail.com | 558432228874 |
| 15346 | ALEXANDRE BRUFATTO SCHOENARDIE | schoenardie.orto@gmail.com |  |
| 8840 | ALEXANDRE FORTES DRUMMOND | afdorto@gmail.com | 553132252176 |
| 15118 | Alexandre hadaya | Hadaya@terra.com.br | 55 1198129614 |
| 38789 | Alexandre Kowalczuck | a_kowalczuck@hotmail.com | 55 41999921155 |
| 8713 | ALEXANDRE LISBOA DE MACEDO | alexandre@odontologiaintegrada-al.com.br | 558233279696 |
| 8686 | ALEXANDRE MAGNO DE NEGREIROS DIÓGENES | dralexandre@clinicaalexandrediogenes.com.br | 558433214918 |
| 6977 | Alexandre Moro | alexandremoro@uol.com.br | 554130273092 |
| 7902 | Alexandre Protásio Vianna | alexandre_vianna@hotmail.com | 5571988708101 |
| 837 | Alexandre Soares | alexandresoares.odontologia@gmail.com | 5521988888600 |
| 33787 | Alexandre Teixeira Silva | alexandreteixeiradent@gmail.com | 55 88997128900 |
| 5871 | Alexandre Trindade Simões Motta | atsmotta@gmail.com | 55 21988957020 |
| 6966 | Alexandre Vilhena Góes | avgoes@hotmail.com | 5596991181221 |
| 15925 | Alexis García Jurado | av.orthokids@gmail.com | +52 7224568236 |
| 34351 | Alexsandra Heloísa de Amorim Nascimento Prado | alexsandra.nascimentoprado@gmail.com | 5579998096738 |
| 38965 | Alfonso Cuesta | pompicuesta@hotmail.com |  |
| 5709 | Alfredo Augusto Novoa Vasquez | doc.nv.007@hotmail.com | 947914584 |
| 14798 | alfredo caycho rodriguez | alfredocaycho_0801@hotmail.com |  |
| 16011 | Alfredo Rafael Nadal Morales | alfredornadal@yahoo.com |  |
| 8961 | ALICE SPITZ | alicespitz1@gmail.com | 5521998750022 |
| 23960 | Alicia Aichenbaum | aliaich@gmail.com |  |
| 15468 | Alicia Clara Schiraldi | aliciaclaraschiraldi@gmail.com |  |
| 16045 | Alicia Gonzalez | alicia@dentalia.com.py |  |
| 17137 | Alicia Guzman | dra.alicia.guzman@gmail.com |  |
| 10682 | Alicia Hirumi Moreno | hirumimoreno@gmail.com | 58412992352 |
| 21375 | Alina Reyes Aguilar | reyesaa04@gmail.com |  |
| 9092 | ALINE APARECIDA DE SANTANA | aline.a.sant@gmail.com | 5519997536296 |
| 8837 | ALINE DE FRANCESCHI | alinedefranceschi@yahoo.com.br | 5551999922613 |
| 8772 | ALINE DE OLIVEIRA SILVA MAGALHÃES | draalineoliveira@yahoo.com.br | 551533539114 |
| 8943 | ALINE DE OLIVEIRA WAKED CALADO | alinewaked@hotmail.com | 5581988692000 |
| 8714 | ALINE LEVI BARATTA MONTEIRO | alinebaratta@yahoo.com.br | 5585988499792 |
| 8922 | ALINE OLIVEIRA DA SILVA | aline5.silva@usp.br | 5514996107569 |
| 38922 | Aline Pereira Ventura | ortoaline@hotmail.com | 5521981328317 |
| 8715 | ALINE TIEMI OYADOMARI | anuidade1022@gmail.com | 5513996365123 |
| 10831 | ALINE TONASSI DE ANDRADE SCHERRER | ALINETONASSI@HOTMAIL.COM | +55 22999148855 |
| 8716 | ALIRIANA FROTA LIMA | alirianafrota@hotmail.com | 5585988284099 |
| 15470 | Alix María Salinas Rodriguez | alixsdl@hotmail.com |  |
| 22251 | Allisson Rebello | allissonrebello@yahoo.com.br | 55 13974066306 |
| 15794 | Alma Angélica Velasco Bandala | alma@ortodonciavelasco.com |  |
| 17708 | Alma Arlette Santa Maria Torres | adentalsantamaria@gmail.com |  |
| 16464 | Alma Nery Alba Bonilla | neryalba@hotmail.com |  |
| 17110 | Alma Rosa Angeles Arenas | dra.angeles93@hotmail.com |  |
| 32698 | Alonso Veronica Re | veroregin@gmail.com |  |
| 17143 | Alonzo hugo gonzalez hurtado | alonzodxnbrasil1008@gmail.com |  |
| 32356 | Alvaro Augusto Junqueira Jr | aaajunqueira@gmail.com | 5516992731989 |
| 21614 | Alvaro Jose da Silva Filho | afperiodontia@hotmail.com | 55 (62) 98433-2351 |
| 15652 | Alvaro Neira Muñoz | alvaroadolfo.neira@gmail.com | +56 954109231 |
| 16402 | Alvaro Perez | javmirabal@hotmail.com |  |
| 10279 | alvise caburlotto | a.caburlotto@gmail.com | +39 3407227143 |
| 2521 | ALYSON DE SOUZA REIS | reis.alysons@gmail.com | 5521965406134 |
| 9993 | Amanda Achkar Coli | amanda.achkar@icloud.com | 55 15997718867 |
| 9141 | AMANDA BARBOSA PEREIRA | amandabarbosap@gmail.com | 5585987052989 |
| 3001 | AMANDA CASSIA FERREIRA DE MOURA | cassia.odonto@hotmail.com | 5581996881603 |
| 8834 | AMANDA DE CARVALHO DESIDERÁ | acdesidera@yahoo.com | 5516981267094 |
| 33652 | Amanda Gobbato | gobbatinho@icloud.com | 55 54981534263 |
| 8717 | AMANDA MARQUES GONÇALVES | mgoncalvesamanda@gmail.com | 5521994160054 |
| 2164 | Amanda Rossi Corelhano | amandacore@hotmail.com | 55 41997641255 |
| 10827 | Amanda Wessling Demay | amandawd3@hotmail.com | 55 (48) 99964 - 3355 |
| 17144 | Amauris Perez Compres | amaurisperez034@gmail.com |  |
| 14446 | Amin Dehghan | amde8766@yahoo.com | +47 41277748 |
| 23965 | Amir Guzman Bierd | dra.bierd@hotmail.com |  |
| 9142 | ANA BEATRIZ NOBRE DE ALENCAR | anabeatriznobre.odonto@gmail.com | 5585997207577 |
| 38891 | Ana Belén Kunzle Correa | anitakunzle@hotmail.com | 59598277181 |
| 16649 | Ana Belén Martínez | Anabelen.martinez.uv@gmail.com |  |
| 33675 | Ana Carina Santos Gomes | ana.carisantos@gmail.com | 351963194500 |
| 8718 | ANA CARLA DE SOUZA NASCIMENTO | anacarla.orto@gmail.com | 5571992129822 |
| 32880 | Ana Carolina | carolccarneiro1@gmail.com | 55 91991031523 |
| 18197 | Ana Carolina Aguiar | anacaguiar30@gmail.com |  |
| 9127 | ANA CAROLINA ESMERALDO APOLINÁRIO | ana.c.apolinario@gmail.com | 556132230700 |
| 14861 | Ana Carolina Francischone | afrancischone@hotmail.com | 55 (14)99794-4007 |
| 4183 | Ana Carolina Mas López | anacarolinamas@hotmail.com |  |
| 9013 | ANA CAROLINA MUDREK | acmudrek@gmail.com | 554198869340 |
| 8172 | ANA CAROLINA NUNES E SILVA | anacaroliinanunes@gmail.com | 5518997401994 |
| 32634 | Ana Carolina Sierra Poveda | lscprada@gmail.com |  |
| 15449 | Ana Catalina Hernandez Henriquez | dracatyhernandez@gmail.com |  |
| 8698 | ANA CATARINA DE MIRANDA MOTA | consultorioanacatarina@gmail.com | 558532617414 |
| 9313 | Ana Catarina de Miranda Mota | anacatarinamm@oi.com.br | 5585999852413 |
| 19665 | Ana Christina Bernardes de Souza | ac171274@hotmail.com | 55 19991769440 |
| 8699 | ANA CLARA NUNES SANTOS | clarinhans89@gmail.com | 5581992545463 |
| 8918 | ANA CLAUDIA GUIMARÃES COSTA | ortoortop@gmail.com | 5519997013532 |
| 2536 | Ana Conti | accfconti@uol.com.br | 5514997957795 |
| 17068 | Ana Cristina Gurgel Maranhao | anacristinagurgel@hotmail.com |  |
| 9100 | ANA CRISTINA LIMA VIEIRA | anaorto@uol.com.br | 551130459552 |
| 9143 | ANA CRISTINA LUNA DE CARVALHO | analunacarvalho31@gmail.com | 5585988943265 |
| 8841 | ANA CRISTINA MOREIRA SILVA ARAÚJO | anacristina@ortodontista.com.br | 553132870566 |
| 9245 | ANA DE LOURDES SÁ DE LIRA | anadelourdessl@hotmail.com | 558630253885 |
| 17089 | Ana Elizabeth Molina Plascencia | aneli_mx@hotmail.com |  |
| 14932 | Ana Gabriela Zúñiga Manriquez | babiela_87@hotmail.com |  |
| 9311 | Ana Joaquim | amjoaquim7@gmail.com | +351 968169236 |
| 16022 | Ana Karen Bautista Cabrera | dra.karen.bautista@hotmail.com |  |
| 14715 | Ana karina Pérez gil | anakp19asdasdasdaqweasdqwe@gmail.com |  |
| 38940 | Ana Laura Adorni | ana_adorni@hotmail.com |  |
| 9650 | Ana Lorena Gomez Guardia | algomezg@hotmail.com | +507 66714594 |
| 16675 | Ana lorena Hurtado caceres | lorenahuca@gmail.com |  |
| 8842 | ANA LOUISA TAMBOSI DOS SANTOS | analouisa@hotmail.com | 5547999715397 |
| 9401 | Ana Lucia de Almeida | lucalmeida.ana@hotmail.com | 5531982729179 |
| 19297 | Ana Lúcia Hirsch | anahirsch4@gmail.com | 55 21981122266 |
| 8678 | ANA LUIZA COSTA SILVA DE OMENA | analuizaomena@gmail.com | 558233272396 |
| 8719 | ANA LUIZA SANTIAGO LOPES | analuizasantlopes@gmail.com | 5522999444287 |
| 23975 | Ana Luiza Tura | ana.tura@hotmail.com |  |
| 17111 | Ana Mara Ocampo Rodrguez | aocampo8@msn.com |  |
| 17142 | ANA MARA RAMREZ MARTNEZ | am.ramirez@unicieo.edu.co |  |
| 17088 | Ana Mara Zapata Jara | amzapata@gmail.com |  |
| 15561 | ANA MARGARETH CHAGAS SOARES | anamargarehth.soares@gmail.com |  |
| 14850 | Ana Margareth Chagas Soares | anamargareth.soares@gmail.com | 5579999598121 |
| 23921 | ana maria alessio | anamaalessio@gmail.com |  |
| 8897 | ANA MARIA MARTINS BRANDÃO | ammbrandao@gmail.com | 559132224678 |
| 16026 | Ana María Osar | anamariaosar@gmail.com |  |
| 31311 | Ana Maria Santos Beaumord | anabeaumord@gmail.com |  |
| 15588 | Ana Marta Alves | martaalves1964@gmail.com | 351 912835649 |
| 15058 | Ana Meza | ortodentis1@hotmail.com |  |
| 23932 | Ana Ortiz | anamariadds911@gmail.com |  |
| 9128 | ANA PAULA ALVOLEDO ROCHA MELLO | ana.alvoledo@gmail.com | 5511993455249 |
| 14849 | Ana Paula Moreira Ramos | anapaulamramos@yahoo.com.br | 5531991795242 |
| 8910 | ANA PAULA PÚBLIO BESSELER | anapublio@yahoo.com.br | 5519981112424 |
| 3667 | Ana Rubia Azoia | anarubiachiarazoia@gmail.com | 5514997007377 |
| 9112 | ANA THAIS BAGATINI | ana.bagatini@unesp.br | 5535999122309 |
| 10830 | Ana Zilda Nazar Bergamo | anazbergamo@hotmail.com | 55 999912465 |
| 32640 | Anabely Avilés Peñaloza | anabelly_5@hotmail.com |  |
| 16657 | Analía Ferreira | aferfer44@gmail.com |  |
| 33798 | Anamary Alvarez Testar | anamaryalvareztestar@gmail.com |  |
| 32309 | anamsell | anamsell@gmail.com |  |
| 20495 | ANARELA BERNARDI VASSEN | anarela.bernardi@hotmail.com | 55 48984745786 |
| 8720 | ANDERSON CARLOS DE OLIVEIRA | anderson_carlos_rj@yahoo.com.br | 552127629503 |
| 7468 | ANDERSON KIKUCHI MORAES DE OLIVEIRA | andersonkikuchi@hotmail.com | +55 91991460505 |
| 15014 | Anderson Maia Meneses | andersonmmeneses@gmail.com | 55 85989696484 |
| 38966 | Andisheh Esmailli Hodjreh | drortomadrid@gmail.com |  |
| 9129 | ANDRÉ FELIPE ABRÃO | andre@cetao.com.br | 551135643513 |
| 21541 | André Said Queiroz Lopes Rezek | dr.andrerezek@gmail.com | 55 95981027837 |
| 9028 | ANDRÉ TANIGUCHI | andretaniguchi@yahoo.com.br | 5591981353136 |
| 9962 | Andre Weissheimer | drandreweissheimer@gmail.com | 19499224917 |
| 8962 | ANDRÉ WILSON LIMA MACHADO | awmachado@bol.com.br | 557133341163 |
| 15420 | ANDREA DELL OSO | andydelloso@gmail.com |  |
| 15959 | Andrea Edith Busleiman | andreabusleiman@gmail.com |  |
| 15542 | Andrea Fonseca Jardim da Motta | afjmotta@gmail.com | 55 21998873045 |
| 38964 | Andrea Guevara B | andreagueb05@gmail.com |  |
| 9060 | ANDREA HOETTE STAHLKE | andrea@stahlke.com.br | 5541999237020 |
| 7490 | Andrea Iuguetti Morais | andreaiughetti@hotmail.com | 558532422239 |
| 2967 | ANDRÉA MARIA ASSIS CARDOSO LOPES | amaclopes@hotmail.com | 557135031111 |
| 15272 | Andrea Maria Nossa Moreno | nossita10@hotmail.com |  |
| 8366 | Andrea Maria Reis Melo de Araujo Costa | andreareismelo@hotmail.com | +55 991261309 |
| 7095 | Andrea Paula Freire de Medeiros Sinclair | andrea-sinclair@hotmail.com | 558433217754 |
| 8721 | ANDRÉA PAULA FREIRE DE MEDEIROS SINCLAIR | andreapsinclair@gmail.com | 558433217754 |
| 10119 | Andrea ramos | andrearamosceso@gmail.com | 525583720883 |
| 9017 | ANDREA SACCOMORI PALMA | andrea@santesorriso.com.br | 5551997027960 |
| 16018 | Andrea Verónica Guzmán Uribe | dra.aguzmanu@gmail.com |  |
| 1644 | Andreia Ramos | andreiaisabel.ramos@gmail.com | 0000000000000 |
| 10628 | Andres Bello | bogotapacientes@gmail.com | 573053530937 |
| 8219 | andres bello | iprlatam@gmail.com | 3053530937 |
| 16394 | Andres Eduardo Hernandez Rodriguez | golden.dental23@gmail.com |  |
| 15427 | Andres Ricardo Gonzalez Rojas | andreswolf91@hotmail.com |  |
| 8938 | ANDRESSA KARLA VIEIRA ABRÃO | andressinhaabrao@outlook.com | 5564981359893 |
| 10670 | Andrew Chang | andrew31.chang@gmail.com | 61 0434839899 |
| 4975 | Andrey Jeanpierre | andrey_j88@hotmail.com | 51 945555360 |
| 8939 | ANDREY LOCKS PRAZERES | andreylprazeres@yahoo.com.br | 554832220458 |
| 15198 | Angel de Jesus Flores Silva | angel_florez15@hotmail.com |  |
| 21508 | Angel Josue Quinzo Revelo | angelquinzo22@gmail.com |  |
| 32636 | Angel Polivio Toapanta Yugcha | angelitos84@hotmail.es |  |
| 14631 | Angel Popoca | dr.arturopopoca@gmail.com |  |
| 16029 | Ángela Elena Matías Echevarría | cleyre_21@hotmail.com |  |
| 17108 | Angela maria trujillo robles | amtrujillorobles@hotmail.com |  |
| 23963 | Angela Mereuta | amereuta21@gmail.com |  |
| 22988 | ANGELAKIS IOANNIS | dr.j.angelakis@gmail.com | 30 6978096988 |
| 8857 | ANGELICA ABREU LIMA DE OLIVEIRA | a.abreu10@hotmail.com | 5531984592331 |
| 32613 | Angelica Delgado Pintor | delgadopintor@yahoo.com.mx |  |
| 5450 | Angelica Gonzatti | angelica_gonzatti@hotmail.com | 55 49991785984 |
| 17693 | Angelica H. Rozzano | angierozza1@gmail.com |  |
| 16009 | Angélica María Vaides Sandoval | vaides2812@gmail.com |  |
| 14761 | ANGELICA NADYELI PIÑA LOPEZ | draangelicapina@outlook.com |  |
| 32667 | Angely Bonilla Villanueva | angely.bonillav@gmail.com |  |
| 23909 | Anibal Calzadilla Bastidas | anibalcb55@gmail.com |  |
| 2382 | Anita Ribeiro | tata_carolina@hotmail.com | 5511996348412 |
| 39269 | ANNA CAROLINA GANIMI | annacganimi@gmail.com | 55 21999899740 |
| 10019 | Anna Eunice Moreira Menezes | annaemenezes@gmail.com | 5565999347802 |
| 24000 | Anna Han | anialesko@o2.pl | 48794555999 |
| 8806 | ANNA JÚLIA DE OLIVEIRA FAÇANHA | annajulia13@hotmail.com | 558534611698 |
| 17118 | Anna Patricia Zini | annapatriciazini@hotmail.com |  |
| 4859 | Annamaria Ximenes | annamariabrasil@uol.com.br | 558532670222 |
| 8858 | ANNE CAROLINE FURTUNATO QUEIROGA MACIEL | anne.queiroga@hotmail.com | 5581988069886 |
| 9029 | ANNE CAROLINNE NEVES DAMIÃO | carolinnedamiao@gmail.com | 5591982971187 |
| 15150 | Annelise Hachmann | anneliseh.odontologia@gmail.com |  |
| 19332 | Annie Bertha Sevillano Nalvarte | anniesevillanon1969@gmail.com |  |
| 19329 | Anthony Emil Warden Ramirez | anthonywardenrz@gmail.com |  |
| 20607 | Antonella Di Stefano | Antito.distefano@gmail.com | 541130436356 |
| 15202 | ANTONIO | lazantonio472@gmail.com |  |
| 15037 | Antônio Abbud Netto | nettoabbud@hotmail.com | 55 16991542359 |
| 15387 | Antônio Carlos de Oliveira Ruellas | antonioruellas@yahoo.com.br |  |
| 8946 | ANTONIO DAVID CORREA NORMANDO | davidnormando@hotmail.com | 559132251561 |
| 8914 | ANTONIO IGNÁCIO PUPO NETO | financeiro@pupoodontologia.com.br | 5515981166162 |
| 5877 | ANTONIO JOSE BORIN NETO | borinortodontia@gmail.com |  |
| 15341 | Antônio Uxa Jacob | aujacob@gmail.com |  |
| 9085 | ANTÔNIO UXA JACOB | aujacobortodontia@gmail.com | 553132232010 |
| 15672 | Antonio Varela Cancio | avarelac@gmail.com | 55 71987065964 |
| 9063 | ANYARA SOARES AIRES | anyaraaires@hotmail.com | 558632226407 |
| 15915 | Apolinar Damián Morante | adm05_@hotmail.com |  |
| 15491 | Arely Gabriela Daniel Brand | gabriela.danielb@gmail.com |  |
| 38953 | Argelia Ferrero Romero | argeferrero@gmail.com |  |
| 9144 | ARIANE SALGADO GONZAGA | salgado.gonzaga@gmail.com | 5584981101101 |
| 9953 | Arianel Amador Lara | aryamadorlara@hotmail.com | +34 6142468129 |
| 38962 | Arianne Perdomo | arianneperdomo@hotmail.com |  |
| 15445 | Ariel Saric | arielsaric@hotmail.com |  |
| 2990 | Armando Amorim de Mendonca | armandomendonca@me.com | 5516981121122 |
| 8915 | ARMANDO ANTONIO LIMA | armlima2000@bol.com.br | 553132614871 |
| 8722 | ARMINDA LUIZA PALMEIRA GOMES | armindaluiza@hotmail.com | 5562992231706 |
| 14794 | Arnold David Giron Alvarado | adga8@hotmail.com |  |
| 8723 | ARTHUR ANTUNES DA SILVA ALELAF | arthuralelaf@icloud.com | 5586999859534 |
| 4615 | Arthur César de Medeiros Alves | arthurcesar_88@hotmail.com | 55 84996069657 |
| 3549 | ARTHUR COSTA RODRIGUES FARIAS | arthurcrfarias@hotmail.com | 5584999030012 |
| 8941 | ARTHUR CUNHA DA SILVA | arthur_cunha@alumni.usp.br | 5521967637007 |
| 38740 | Artur José Vasconcelos de Queiroz | arturqueirozodontologia@gmail.com | 5581999657446 |
| 7101 | Artur Pfeifer | artur.imaxi@gmail.com | +55 47999744041 |
| 10860 | Arua Dagnone | arua_ru@yahoo.com.br | +55 974049553 |
| 6816 | ARY DOS SANTOS PINTO | spinto@foar.unesp.br | 551633361731 |
| 15843 | Astrid Garcia Flores | astridgf24@gmail.com |  |
| 19365 | Astrid Lemus Velásquez | astrid.lv@hotmail.com |  |
| 21372 | Audrey Aponte | aponteaudrey@gmail.com |  |
| 14641 | Audrey Yoon | audrey12@stanford.edu |  |
| 22899 | Augusto Candido Vieira | augustovieira12@hotmail.com | 55 31999018630 |
| 17091 | Augusto Enrique Reyes Vargas | areyesdent@gmail.com |  |
| 2152 | Augusto Garcia | augustoig@uol.com.br | +55 3788053743 |
| 15426 | AURA MARINA QUIROA SILVA | auriderios@gmail.com |  |
| 9109 | AURENITA BELAS LUSTOSA | aurenitablustosa@gmail.com | 556133262210 |
| 15518 | Aurora verónica Duarte | veronica7920@gmail.com |  |
| 14836 | Aylla nardi akutsu | ayllanakutsu@hotmail.com | 55 15998365219 |
| 17718 | Barbara Andrea Feldman Fuentes | barbara.feldmanf@gmail.com | 56 981365304 |
| 9073 | BARBARA CECÍLIA TURY BLUMER | barbara.blumer@hotmail.com | 5516997552194 |
| 16690 | Bárbara Fernandes Luchi | barbarafluchi@gmail.com | 55 27996962008 |
| 21976 | Bárbara Kerber | barbara_kerber15@hotmail.com | 55 996887484 |
| 9426 | Barbara Paganoti | bpaganoti@gmail.com | 5595991779856 |
| 38951 | Barbara S Freites Afiuni | barbarafreitesa@gmail.com |  |
| 8825 | BARBARA TAVARES | barbarapillatavares@gmail.com | 5551981826442 |
| 21470 | Bartolomeu dos Santos Sobral Filho | giroimagem3d@gmail.com | 55 |
| 5834 | Bayardo Bolaños | bayardobbr@hotmail.com |  |
| 6229 | Beatriz de Melo Andrade | beatriz.meloandrade@yahoo.com.br | +55 31 99264-5246 |
| 15380 | Beatriz de Souza Vilella | beatriz.vilella@gmail.com | +55 21992555650 |
| 15423 | Beatriz Erazo | biaeu@hotmail.com |  |
| 14744 | Beatriz Fanny Huerta Rosales | drabeatriz@saludental.net |  |
| 32842 | Beatriz motoyama | beatrizmotoyama@gmail.com | 55 18997723444 |
| 17122 | Beatriz Navarro H | bea.anh@gmail.com |  |
| 8859 | BEATRIZ QUEVEDO | anuidade0080@gmail.com | 5514981089749 |
| 23900 | Beatriz Raquel Valencia Silva | bettyby03@hotmail.com |  |
| 9006 | BEATRIZ SALOMÃO PORTO ALEGRE ROSA | beatrizsparosa@gmail.com | 5521982658929 |
| 8476 | beatrizrossibeira@hotmail.com | beatrizrossibeira@hotmail.com | +55 44997106888 |
| 38945 | Belen Ramos Salas | ramossalasbelen@gmail.com |  |
| 32617 | Belen Weiss | beluweiss@hotmail.com |  |
| 37873 | Belkis Jannine Inés Leguizamon Presentado | belkislegui@gmail.com | 595  595975310684 |
| 19372 | Belú Campos Chávez | belucamp1@gmail.com |  |
| 10160 | Benedict Wilmes | wilmes@med.uni-duesseldorf.de | 491722746644 |
| 5382 | Benedicta Baez | dra.benedictabaez@gmail.com | 1809 8295588513 |
| 8349 | Benedita ivania Ricardo Ribeiro | ivania.rribeiro47@gmail.com | 5511933263871 |
| 8947 | BENEDITO VIANA FREITAS | beneditovfreitas@uol.com.br | 5598991191160 |
| 31259 | Berenice Nava De la Barrera | berenaba42@gmail.com |  |
| 38946 | Berlinessa Collado | berlicollado@yahoo.com |  |
| 9018 | BERNARDO EMERENCIANO BARROS MAIA | bernardoemaia@hotmail.com | 5584999862410 |
| 38952 | Bernardo Feliz Terrero | bernardofeliz12@gmail.com |  |
| 8963 | BERNARDO QUIROGA SOUKI | souki.bhe@terra.com.br | 553132455108 |
| 16392 | Bethsaray L. De lange-Briez | de.lange.bethsaray@gmail.com |  |
| 15329 | Betina Behs | betinabehs@gmail.com |  |
| 1571 | BETINA GREHS PORTO | betinagrehs@hotmail.com |  |
| 5259 | BETINA GREHS PORTO | betinagporto@gmail.com | 555533124104 |
| 14784 | Betzy Marilena Portillo Portillo | betzyportillo@gmail.com |  |
| 9145 | BIANCA BOSSAY | bi_scudeller@hotmail.com | 5567999619153 |
| 9030 | BIANCA ROCHA RIBEIRO | biancarocharibeiro@hotmail.com | 5585991515422 |
| 33160 | bichra yassine | bichrayassine@gmail.com | 212661225611 |
| 16459 | Bismark flores rojas | floresrojasbismark@gmail.com |  |
| 32637 | Bladimir Lenin Sánchez Flores | blen_sanchez@hotmail.com |  |
| 38937 | Blanca Estela Rios Uribe | blancaeru3397@hotmail.com |  |
| 38934 | Blanca Salas | cenroof95@hotmail.com |  |
| 14773 | Blanca Sánchez Luna | snchezlunablanca@hotmail.com |  |
| 20541 | Bogdan Dimitriu | bogdim@gmail.com | 40 0744580012 |
| 15523 | Bolognini Andrea Viviana | andreabgn@hotmail.com |  |
| 14713 | BONAUDI ELIZABETH ANDREA | andreabonaudi@hotmail.com |  |
| 19362 | Bordogna María Victoria | victoriabordogna@hotmail.com |  |
| 15476 | Borkman Erhart Molina Barahona | infodrbork@gmail.com |  |
| 19249 | BRANDON SMITH | dentalgo.com.br.juggle048@passmail.net | 13042633131 |
| 14689 | Braulio Dario Apaza Coronel | braulio.dental@gmail.com |  |
| 10475 | BRAVO CORPAS S.L | info@institutodentalbravocorpas.es | +34 658884668 |
| 18255 | Brayan Sley Rodríguez Vinza | bryansr_94@hotmail.com |  |
| 33082 | brenda araldi | brendaaraldi@hotmail.com | 55 54981374320 |
| 22522 | Breno Rodrigues | brenohmrodrigues14@gmail.com | 55 |
| 15524 | Brest Javier Paucar Montesinos | brestzero@icloud.com |  |
| 15492 | Brian Eduardo Enamorado Robleda | benamorado24@gmail.com |  |
| 15505 | Brian Gilberto Roman Gastelum | briangastelum11@gmail.com |  |
| 15701 | Brigithe Baldarrago ochoa | brigithebaldarragoochoa@gmail.com | 51 986482500 |
| 31255 | Bruna Cepeda | bruna.cepeda@gmail.com |  |
| 10642 | Bruna Dicieri | brunadicieri@gmail.com | 55 |
| 8925 | BRUNA GABRIELA FLOSS PEDROTTI | brunagabrielafp@hotmail.com | 5555996452443 |
| 2519 | BRUNA MALUZA FLOREZ | brunaflorez@hotmail.com | 551332322306 |
| 8563 | Bruna Motta Minusculi | brunamotta@gmail.com | 5549991932413 |
| 6490 | Bruna Stieve | brunastieve@hotmail.com |  |
| 8828 | BRUNA STRAUBEL SOARES | Brunastsoares@hotmail.com | 5549999766812 |
| 15365 | Bruno Barbo | bruno.barbo@hotmail.com | 55 54991764807 |
| 21241 | Bruno dos Santos | brnsants@gmail.com | 55 15991187375 |
| 8905 | BRUNO MOREIRA DAS NEVES | bruno_moreira_moreira@hotmail.com | 5522981152181 |
| 19345 | Bryan duarte Barboza | bduarte@dentiacr.com |  |
| 38942 | C Bosnero María | mceciliabosnero@hotmail.com |  |
| 25662 | C�nthia Ferreira Alves | cfa512@hotmail.com |  |
| 21378 | Cacilda Garbin | cacildagarbin@gmail.com |  |
| 9211 | Caíque Leão | dr.caiqueleao@gmail.com | +55 91991510503 |
| 9146 | CALINE ROCHA VIANA DE ARAÚJO | calinervaraujo@hotmail.com | 5585997924444 |
| 9019 | CAMILA AMBROSI | camiambrosi@gmail.com | 5548999698223 |
| 19816 | Camila Andrea Troncoso Novoa | cami.troncoso@gmail.com | 56 998243079 |
| 38697 | Camila de Assis Patrício | camilaapatricio@hotmail.com | 55 31988986872 |
| 14443 | CAMILA DOS SANTOS BLANCO | dracamilablanco@gmail.com | 5185674086 |
| 19582 | Camila Fiorilo | camifio_13@hotmail.com |  |
| 16866 | Camila Imperador Rodrigues Alves | camila-imperador@hotmail.com.br | 55 16991760337 |
| 9101 | CAMILA LOPES ROCHA | camilalrocha_@hotmail.com | 5585996161808 |
| 8257 | Camila Maria Bastos Machado de Resende | cmbmachado@hotmail.com | 5584999912771 |
| 9339 | Camila Mecchi Martins | camilanecchi@gmail.com | 5566996912520 |
| 15543 | CAMILA MIORELLI GIRONDI | camila.girondi@gmail.com | 1140342234 |
| 9049 | CAMILA MONTEIRO LINHARES | linhares.ca@gmail.com | 5511948002151 |
| 8791 | CAMILA ZAGER TINOCO VIANA | camilazager@gmail.com | 552124331735 |
| 8843 | CAMILLE TORRES COSTA FERREIRA | camille_torres1@hotmail.com | 5521965719655 |
| 8773 | CANDICE BELCHIOR DUPLAT | candicebelchior@hotmail.com | 5571981462096 |
| 2283 | Carina Almeida | cah.carina@hotmail.com | +55 44 99812280 |
| 19554 | CARINE LOURENÇO DE ALMEIDA  GREJO | carinegrejo@hotmail.com |  |
| 15607 | Carla Bustíos Muñoz | carlabustios@gmail.com |  |
| 17151 | Carla Cifuentes Harris | carla.cifuentes.harris@gmail.com | 56 964769082 |
| 8679 | CARLA COSTA DE ARECIPPO | carlaarecippo@hotmail.com | 5582996796731 |
| 8964 | CARLA D´AGOSTINI DERECH | carladerech.ortodontia@gmail.com | 5548999894055 |
| 24341 | Carla Eloisa Minozzo | carlinha.minozzo@gmail.com | 55 41995743455 |
| 9010 | CARLA MARIÉ DE BRITO KATÓ | cmbkato@yahoo.com.br | 5591999696157 |
| 9698 | Carla Paquita Moreno Silva | karlet_89@hotmail.com | +55 992516757 |
| 6788 | Carla Purihuaman | carla.purihuaman@gmail.com |  |
| 8807 | CARLA VIRGINIA ARAÚJO VASCONCELOS | carlaaraujo123@yahoo.com | 558532425252 |
| 21478 | Carlo Bosoni | carlo.bosoni@unifi.it |  |
| 14818 | Carlos | carlossanchezmadrid@yahoo.es | 34 630511072 |
| 15229 | CARLOS ALBERTO CORNEJO VALDIVIA | kairosoe@outlook.com | 51 945717010 |
| 15416 | Carlos Alberto Majin Grajales | cabeto.06@hotmail.com |  |
| 3027 | Carlos Alexandre Camara | carlosalexandrecamara@gmail.com | 558496890708 |
| 17149 | Carlos Alexandre Rodrigues Peçanha | livrariaa.saber@gmail.com | 55 28999039363 |
| 17154 | CARLOS ANDRES MORENO | a_n_d_r_e_s6@hotmail.com | 57 3125220863 |
| 10495 | Carlos Antonio Rojas Granados | clinicaderetratamiento@hotmail.com | 52 5564899572 |
| 16086 | Carlos Balazarte | carlos_balazarte17@hotmail.com |  |
| 14781 | Carlos Eduardo Herrera Hernández | hhceortodoncia@gmail.com | +52 5527799705 |
| 15657 | Carlos Eduardo Lopes | caedlobu@hotmail.com |  |
| 4729 | Carlos Filho | cpfcarlosparenti@gmail.com | 551122935999 |
| 7161 | Carlos Floresmir | cf1@ualberta.ca | 17809047409 |
| 14767 | Carlos Franco | drcfa@alumni.usp.br |  |
| 16342 | carlos henrique oliveira braga | odontologiach@gmail.com | 55 75992844246 |
| 19571 | Carlos Jair De La Puente Sanchez | delapuentesa@gmail.com |  |
| 16039 | Carlos Liebbe | carlosliebbe@gmail.com |  |
| 33145 | CARLOS LLERENA | dcarlo.1982@gmail.com | 593 984646013 |
| 14992 | Carlos Manterola | Carlosmanterola@gmail.com |  |
| 5499 | Carlos Marassi | marassi@me.com | +55 21985021009 |
| 32661 | Carlos Medina Diaz | doctorcarlosmedina@hotmail.com |  |
| 34269 | carlos mendes dourado | carlos_mdourado@hotmail.com | 55 (91)98161-6123 |
| 10445 | Carlos Miguel Marto | mig-marto@hotmail.com | 351 934454123 |
| 9770 | carlos muñoz | dr.munozabello@gmail.com | 56977747602 |
| 16079 | Carlos Paternina | paterperez76@hotmail.com |  |
| 23898 | CARLOS PAUL ROJAS RIVAS | paulrojasrivas@hotmail.com |  |
| 10114 | Carlos Peña | carpegdiem@gmail.com | +51 981666447 |
| 8844 | CARLOS RENATO MONTENEGRO | c.r.montenegro@terra.com.br | 558130196597 |
| 32642 | Carlos Roberto Leiva Salmori | carlosrobertoleiva@gmail.com |  |
| 15079 | Carlos Samuel García Pérez | carlossamuelgp@gmail.com |  |
| 31830 | Carlos Villalta | cumbarito22@gmail.com |  |
| 32673 | Carlos Zapata | carlosazapatav@gmail.com |  |
| 32701 | Carmen Adames | dra.adamesortodoncia@gmail.com |  |
| 16383 | Carmen Arevalo | ptesorto@gmail.com | 56 933230661 |
| 16865 | Carmen Serrano | disofit@gmail.com | 5804143298406 |
| 16021 | Carolina Andrea Cruz Paez | krola8014@gmail.com |  |
| 23962 | CAROLINA B LAMARCA | lamarca.carolina@gmail.com |  |
| 23894 | Carolina Bertino | bertinocarolina12@gmail.com |  |
| 8987 | CAROLINA CARMO DE MENEZES | carolinamenezes@fho.edu.br | 5517981560339 |
| 15343 | Carolina Couceiro | dra.carolina@couceiro.com.br |  |
| 8860 | CAROLINA DA LUZ BARATIERI | carolinabaratieri@hotmail.com | 554830287432 |
| 21534 | Carolina da Silva Nunes | carol_nunes1604@yahoo.com.br | 55 (17)992326476 |
| 17798 | Carolina de Barros Morais Cardoso | carol.barros93@hotmail.com | 55 14981612427 |
| 15335 | Carolina Lemos Araújo deveras Guimarães | cdekinha@hotmail.com |  |
| 17124 | Carolina Mamani Chura | carolinafunador@gmail.com |  |
| 8206 | Carolina Marçal Vaz | carolinamvaz@gmail.com | 5511988160856 |
| 2972 | Carolina Mattar da Cruz | mattarcarolina@gmail.com | 5565999810153 |
| 14515 | Carolina Messias da Costa | carollcostta@gmail.com | 55 21993261337 |
| 15455 | Carolina Pastenes | carolinapastenes@hotmail.com |  |
| 16733 | Carolina Riegel | carolina@riegel.com.br | 55 51998452170 |
| 19376 | Carolina rodriguez | Dracrdol@gmail.com |  |
| 4887 | Carolina Rossato Meletti | carolmeletti@hotmail.com | 5554981130400 |
| 9090 | CAROLINA SERVIDONI SPREAFICO | dracarolinaspreafico@gmail.com | 5516997967143 |
| 34383 | Carolina Silva Cestari | carolinascestari@gmail.com | 55 17981718703 |
| 8403 | Caroline Martins Tkacz | cmgambardela@gmail.com | 551136752560 |
| 9079 | CAROLINE PELAGIO MAUÉS CASAGRANDE | carolinemaues@hotmail.com | 552125714643 |
| 33022 | Caroline Weirich | carolineweirichodontologia@gmail.com | 55 54991695907 |
| 15330 | Cassandra Zirbel | drzirbel@zirbelorthodontics.com | 1 651-983-2828 |
| 15295 | Cássia Amaral Trzeciak | cassiatrzeciak@gmail.com | 5553999117992 |
| 8861 | CASSIA CAROLINE MOURA VASCONCELOS | kassya_karolyne@hotmail.com | 5591980620672 |
| 8640 | Catarina C Machado - Ortodontia Especializada | catarinamachado@unifor.br | 5585999857311 |
| 19742 | Catarina Marques Ribeiro Maçarico | catarina.macarico@gmail.com | 351918613627 |
| 15532 | Caty Viñas Dozal | caty_vinas@hotmail.com |  |
| 8862 | CECILIA HELENA GARCIA NUERNBERG | ceci.hgn@gmail.com | 5548984902595 |
| 14729 | Cecilia lucia Robledo | celuroble@gmail.com |  |
| 14717 | Cecilia Raquel Gonzales Rosado | adonaidental@gmail.com |  |
| 15495 | Cecilia silva | ceciliasilvavalerio@hotmail.com |  |
| 14731 | Cecilia Zaragoza | chechuzara.cz@gmail.com |  |
| 9643 | Ceferino Martinez Lopez | Cefe64@hotmail.com | +55 26868376 |
| 14811 | Celenia Monge Tandazo | celeniamonget@hotmail.com |  |
| 32690 | Celestina Maura Luisa Mancilla Ramirez | tinamancilla@hotmail.com |  |
| 8242 | Celia Ferrari | dracelia.ferrari@gmail.com | 5555999622293 |
| 8326 | Celina Basilio de Gayoso e Almendra | cealmendra@yahoo.com.br | 5519991277777 |
| 8863 | CELSO ROGÉRIO MORI DE BARROS | celsormbarros@hotmail.com | 5531996155207 |
| 15680 | Celyna Chamiski | celyna_chamiski@hotmail.com |  |
| 15772 | CESAR ALVAREZ ARANGO | cesara8526@hotmail.com | +34 0000077 |
| 21250 | cesar andre zevallos-quiroz | andrezevallosendodoncia@gmail.com | 51 997326606 |
| 15525 | cesar felipe araya navarro | ipsadental@gmail.com |  |
| 17037 | César Marcelo Díaz Lobo | cesardiazlobo@gmail.com | 56997788773 |
| 10208 | Cesar Mardonio Ruvalcaba Ochoa | c.d.mardo@icloud.com | 5213313834995 |
| 3984 | Cesar Silva | dr.cesarjosesilva@gmail.com | 5511986112504 |
| 10326 | Cheh Pu Wan | luiswan@hotmail.com | 5491158125727 |
| 15598 | Chennouf mehdiya | chenoufmehdiya@gmail.com |  |
| 10885 | christiam barzallo | christbarzallo@hotmail.com | 593998105103 |
| 10778 | Christiam Sandro Barzallo Viteri | christbarzallo@gmail.com |  |
| 14755 | Christian alejandro ferran | christianferran@msn.com |  |
| 9148 | CHRISTIAN ANDREW VARGAS RAMOS | christian.vargas@usp.br | 5516993975233 |
| 14724 | christian astorga izquierdo | clinicaelmaiten@gmail.com |  |
| 15025 | CHRISTIAN BARROS FERREIRA | drbarrosferreira@gmail.com |  |
| 10756 | Christian Juan Talavera Gómez | cjtalaverag248@gmail.com | 51997222509 |
| 8687 | CHRISTIAN LEITE GUEDES | clguedesortodontista@gmail.com | 5531998031166 |
| 15597 | Christian Mauricio Palacios Carrión | christian.palacios.carrion@hotmail.com |  |

_500 registro(s)_

## 15. ASSINANTES ATIVOS (amostra 50)

| id | fullName | email | phoneNumber | plano | valor | intervalType | status | isValidUntil |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 39298 | Maria Isabel | mialima2001@gmail.com | 55 21983264110 | 15 Dias Gratis | 1 | months | active | NULL |
| 34376 | Irma Lucena | dra.irmalucena@gmail.com | 5569993021174 | 15 Dias Gratis | 1 | months | active | NULL |
| 2213 | Christianne Custodio | chrisacustodio@gmail.com | 5521995593107 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | NULL |
| 19915 | Luanna Kairala Costa | luannakcosta@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | NULL |
| 5133 | Fernando Stockler | stocklerf@gmail.com | 5524992358696 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | NULL |
| 1586 | Fernando Manhaes | fernando@fmanhaes.odo.br | 5519981231500 | Dental GO Anual R$78,00 | 7800 | months | active | NULL |
| 39291 | Manuela Castro de Oliveira | manufacul2001@gmail.com | 55 61993078307 | 15 Dias Gratis | 1 | months | active | NULL |
| 38842 | Leonardo Lopes | leolopes23@outlook.com | 5544999904551 | 15 Dias Gratis | 1 | months | active | NULL |
| 15625 | Taynara donario Armendaris | taynaradarmendaris@gmail.com | 5548996428684 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | NULL |
| 5580 | Julyano Vieira da Costa | julyanovieira@gmail.com | 5544991265822 | Dental GO Anual R$78,00 | 7800 | months | active | NULL |
| 39288 | Zé do Cocô | olhaococo@coco.com.br | 55 44998009889 | 15 Dias Gratis | 1 | months | active | NULL |
| 1470 | Murilo Augusto Anacleto | muriloanacleto@uol.com.br | 55 31999884360 | DentalGo Anual R$ 68,00 | 6800 | months | active | NULL |
| 495 | Oswaldo Jose Alves Pinto Junior | oswaldojap.oja@gmail.com | 5511997155728 | DentalGo Anual R$ 68,00 | 6800 | months | active | NULL |
| 39286 | Giovanna Moraes Casalenuovo | casalenuovogiovanna@gmail.com | 5565999972102 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | NULL |
| 39285 | Victória Klippel Santos | vick.klippels@gmail.com | 55 47996870149 | 15 Dias Gratis | 1 | months | active | NULL |
| 10994 | MERCIA W | merciawu1@gmail.com | 351998556559 | DentalGo Anual R$ 68,00 | 6800 | months | active | NULL |
| 9661 | Diogo Jardel Boff | diogojardelboff@icloud.com | +55 54981169797 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | NULL |
| 39282 | Maira Lopes Eising | mairale2001@gmail.com |  | Cortesia Alunos Especializações | 0 | months | active | NULL |
| 15973 | Luiz Guilherme dos Santos | drluiz@maraeodontologia.com.br | 55 48992000036 | SOBRAPI | 1 | months | active | NULL |
| 19716 | MARCO ANTONIO SATO | marcoasato@uol.com.br |  | DentalGo Anual R$ 68,00 | 6800 | months | active | NULL |
| 39281 | teste da silva | teste223@gmail.com | 55 3344556677 | 15 Dias Gratis | 1 | months | active | NULL |
| 34372 | Edimara Domingues Ferreira | edimara.dominguesf@gmail.com | 55 47996167698 | Cortesia Dental Press | 0 | months | active | NULL |
| 16961 | AMANDA MARIA ABREU DE OLIVEIRA | dra.amandoliveira@gmail.com |  | Cortesia Alunos Especializações | 0 | months | active | NULL |
| 39280 | teste 24e24 | maisumtesxte23@teste.com.br | 55 3344556677 | 15 Dias Gratis | 1 | months | active | NULL |
| 39279 | Eu Sou um teste | testesgrandes@testes.com | 55 459966775544 | 15 Dias Gratis | 1 | months | active | NULL |
| 560 | THIARA GUIMARÃES | tguimaraesm@gmail.com | 5573991130672 | Dental GO Anual R$78,00 | 7800 | months | active | NULL |
| 22830 | Caroline Marqui Dantas | c.marqui08@gmail.com | 5511974799230 | Dental GO Anual R$78,00 | 7800 | months | active | NULL |
| 39278 | Anna Laura Carneiro do Carmo | 23001043@uepg.br | 55 42999609822 | 15 Dias Gratis | 1 | months | active | NULL |
| 5712 | Gabriel Vieira Pim | gabriel_pim_@hotmail.com | +55 27998935507 | Dental GO Anual R$78,00 | 7800 | months | active | NULL |
| 39276 | Luiz Renato Paranhos | paranhos.lrp@gmail.com |  | DentalGO Cortesia | 0 | months | active | NULL |
| 860 | Fausto Silva Bramante | faubramante@hotmail.com | 5514991169777 | DentalGo Anual R$ 68,00 | 6800 | months | active | NULL |
| 6097 | Maira Massuia de Souza | mairamassuia@gmail.com | 55 99988338008 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | NULL |
| 6400 | Renan Veiga | renanveiga@hotmail.com.br | 55 43996279323 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | NULL |
| 15045 | FERNANDA APARECIDA CAINELLI SANCHES | facsanches@hotmail.com | 1697925723 | Dental GO Anual R$78,00 | 7800 | months | active | NULL |
| 3204 | Carlos Alberto Estevanell Tavares | carlos.a.e.tavares@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | NULL |
| 39270 | Guilherme Capelozza | gcapelozza@gmail.com |  | Instituto Capelozza | 1 | months | active | NULL |
| 39268 | Pamela Barbosa Cirino | barbosapam30@gmail.com | 55 11949713547 | 15 Dias Gratis | 1 | months | active | NULL |
| 39267 | Jocélio Augusto Nogueira Júnior | jocelioauguston@gmail.com | 55 84998489399 | 15 Dias Gratis | 1 | months | active | NULL |
| 38159 | Iasmim da Fonseca Barros | ODONTOPEDIASMIM@GMAIL.COM |  | Instituto Capelozza | 1 | months | active | NULL |
| 35429 | Livia Camargo Ortega | LIVIACORTEGA@GMAIL.COM |  | Instituto Capelozza | 1 | months | active | NULL |
| 39265 | Janine Soares Morato | nine_morato@hotmail.com | +55 24 99971 0925 | Instituto Capelozza | 1 | months | active | NULL |
| 39266 | Ana Flávia Bissoto Calvo | anacalvo@alumni.usp.br | +55 11 99191 6046 | Instituto Capelozza | 1 | months | active | NULL |
| 39261 | Leticia Tami Almeida Amorim Ikejiri | leticia.ikejiri@gmail.com | +55 14 99752 9696 | Instituto Capelozza | 1 | months | active | NULL |
| 39262 | Lorena Teixeira Melo Bomfim | lorenamelo.odontoped@gmail.com | +55 34 99125 7730 | Instituto Capelozza | 1 | months | active | NULL |
| 39263 | Mariana Rossi Carneiro Gasperini | mariana.rcgasperini@gmail.com | +55 11 99120 1747 | Instituto Capelozza | 1 | months | active | NULL |
| 39264 | Paulo David Sousa Borges | paulodavidsb@gmail.com | +55 37 88081 2340 | Instituto Capelozza | 1 | months | active | NULL |
| 39257 | Ester Franco | esterfranco.ufpa.br@gmail.com | +55 91 83910 0494 | Instituto Capelozza | 1 | months | active | NULL |
| 39258 | Jonathan Rafael Garbim | jrgarbim7@hotmail.com | +55 11 97093 1120 | Instituto Capelozza | 1 | months | active | NULL |
| 39259 | Karina Simonelly | karinasimonelly@gmail.com | +55 17 99725 0101 | Instituto Capelozza | 1 | months | active | NULL |
| 39260 | Letícia Santos Maciel | leticia.maciellsm@gmail.com | +55 11 95127 9936 | Instituto Capelozza | 1 | months | active | NULL |

_50 registro(s)_

## 16. TODOS ASSINANTES ATIVOS (completo)

| id | fullName | email | phoneNumber | plano | valor | intervalType | status | inicio | isValidUntil |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 39278 | Anna Laura Carneiro do Carmo | 23001043@uepg.br | 55 42999609822 | 15 Dias Gratis | 1 | months | active | 2026-06-21 15:11:48 | NULL |
| 9147 | CAROLINA BATISTA CAVALCANTE FREITAS | carolcbcf@gmail.com | 5585996149049 | 15 Dias Gratis | 1 | months | active | 2026-06-15 12:51:54 | NULL |
| 39279 | Eu Sou um teste | testesgrandes@testes.com | 55 459966775544 | 15 Dias Gratis | 1 | months | active | 2026-06-22 14:09:42 | NULL |
| 34376 | Irma Lucena | dra.irmalucena@gmail.com | 5569993021174 | 15 Dias Gratis | 1 | months | active | 2026-06-27 19:54:31 | NULL |
| 39222 | Iza Cristina Fernandes de Sousa | izaendo@gmail.com | 91983853616 | 15 Dias Gratis | 1 | months | active | 2026-06-15 09:51:03 | NULL |
| 39224 | JADE DE SOUZA CAVALCANTE | jadeahj@gmail.com | 55 83999407823 | 15 Dias Gratis | 1 | months | active | 2026-06-15 14:10:43 | NULL |
| 39225 | JADE DE SOUZA CAVALCANTE | jadeahj@uspb.br | 55 83999407823 | 15 Dias Gratis | 1 | months | active | 2026-06-15 14:12:01 | NULL |
| 39267 | Jocélio Augusto Nogueira Júnior | jocelioauguston@gmail.com | 55 84998489399 | 15 Dias Gratis | 1 | months | active | 2026-06-15 23:42:20 | NULL |
| 8950 | JORGE DO NASCIMENTO FABER | faber.jorge@gmail.com | 556133286720 | 15 Dias Gratis | 1 | months | active | 2026-06-14 22:59:36 | NULL |
| 38842 | Leonardo Lopes | leolopes23@outlook.com | 5544999904551 | 15 Dias Gratis | 1 | months | active | 2026-06-25 02:35:33 | NULL |
| 39223 | Lucena Mafaciolli | consultorio-lucena@hotmail.com | 55 (54) 999738509 | 15 Dias Gratis | 1 | months | active | 2026-06-15 11:51:27 | NULL |
| 39291 | Manuela Castro de Oliveira | manufacul2001@gmail.com | 55 61993078307 | 15 Dias Gratis | 1 | months | active | 2026-06-25 12:52:49 | NULL |
| 39298 | Maria Isabel | mialima2001@gmail.com | 55 21983264110 | 15 Dias Gratis | 1 | months | active | 2026-06-28 22:49:34 | NULL |
| 39268 | Pamela Barbosa Cirino | barbosapam30@gmail.com | 55 11949713547 | 15 Dias Gratis | 1 | months | active | 2026-06-16 11:44:47 | NULL |
| 39280 | teste 24e24 | maisumtesxte23@teste.com.br | 55 3344556677 | 15 Dias Gratis | 1 | months | active | 2026-06-22 14:11:19 | NULL |
| 39281 | teste da silva | teste223@gmail.com | 55 3344556677 | 15 Dias Gratis | 1 | months | active | 2026-06-22 14:57:32 | NULL |
| 39285 | Victória Klippel Santos | vick.klippels@gmail.com | 55 47996870149 | 15 Dias Gratis | 1 | months | active | 2026-06-23 17:22:01 | NULL |
| 39288 | Zé do Cocô | olhaococo@coco.com.br | 55 44998009889 | 15 Dias Gratis | 1 | months | active | 2026-06-24 15:24:05 | NULL |
| 9762 | apidentalgo | api@dentalpress.com.br | 5544998009889 | API | 7800 | months | active | 2022-11-25 17:08:25 | NULL |
| 37726 | Camille Riva | camille.riva04@gmail.com | 5511999822396 | CIOSP2026 - 3 Meses Cortesia | 1 | months | active | 2026-02-02 17:47:34 | NULL |
| 2175 | Juan Carlos Chávez | jc.cha03@gmail.com | +51 959911415 | Coletânea Clínica e Journal 2016 | 0 | months | active | 2021-07-05 20:07:58 | NULL |
| 3993 | RICARDO MOREIRA MARQUES | ricardo.mmarques@yahoo.com.br | 5511999841202 | Coletânea Clínica e Journal 2016 | 0 | months | active | 2021-12-06 20:36:34 | NULL |
| 1156 | Marcelo Moraes Freire | mmoraesfor@gmail.com | 5585991881234 | Coletanêa Journal of Orthodontics 2013 | 0 | months | active | 2023-03-21 13:54:39 | NULL |
| 4611 | Alessandra Fernandes Gonçalves Pavan | afgpavan@yahoo.com.br | 5519991927194 | Coletânea Revista Clínica 2016 | 0 | months | active | 2021-08-30 14:46:04 | NULL |
| 2232 |  | ludario.odonto@gmail.com |  | CORTESIA | 0 | months | active | 2021-01-08 14:05:10 | NULL |
| 1051 | Angelica Angeli | angelicaangeliara@gmail.com |  | CORTESIA | 0 | months | active | 2021-01-08 14:17:40 | NULL |
| 10902 | Alexandra Edith caballero clari | alexandracaballerouhg@gmail.com | 5559597258873 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:09:35 | NULL |
| 15181 | ALINE GOERLL | alinegoerllh00@gmail.com |  | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:28:52 | NULL |
| 32789 | Aline Mâmbula Matias | alinemambula@gmail.com | 5565996451818 | Cortesia Alunos Especializações | 0 | months | active | 2025-08-22 14:13:36 | NULL |
| 38913 | Amanda Carneiro Aragão | amandacaragao.odonto@gmail.com | +55 66 99912-1080 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:24:57 | NULL |
| 37942 | Amanda Daldosso da Silva | amanda.daldosso.silva@gmail.com | +55 43 996397461 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:17 | NULL |
| 16961 | AMANDA MARIA ABREU DE OLIVEIRA | dra.amandoliveira@gmail.com |  | Cortesia Alunos Especializações | 0 | months | active | 2026-06-22 14:15:35 | NULL |
| 32975 | Amanda Marones Mundin | amandammarones@gmail.com | 5544991340811 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:46:13 | NULL |
| 37959 | Amanda Stroparo | amandasttrp@gmail.com | 554599902203 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-06 19:05:57 | NULL |
| 37923 | Ana Beatriz Manetti Manganotti | Beatriz.manganotti@hotmail.com | +55 44 999113039 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:50 | NULL |
| 37948 | Ana Beatriz Teles Carvalho | anateles008@gmail.com | +55 44 988131700 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:19 | NULL |
| 32976 | Ana Julia Ferreira Martins | ana_juliatl@hotmail.com | 5567996926809 | Cortesia Alunos Especializações | 0 | months | active | 2025-09-16 12:55:37 | NULL |
| 16416 | Ana laura Loureiro xavier | analauralxavier@hotmail.com | 5551981099539 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:10:25 | NULL |
| 38439 | Ana Paula de Melo Branco | anap_mello@hotmail.com | 5544991840710 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-10 20:17:42 | NULL |
| 3515 | Ana Paula Forcelli | anapaulaforcelli@gmail.com | 5544999676373 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-13 13:09:09 | NULL |
| 37911 | Anayara Perri da Silva | perrianayara@gmail.com | +55 44 988028819 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:47 | NULL |
| 38911 | Andiara Priscila Goldoni | andipgoldoni@hotmail.com | +55 44 99803-6564 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:24:56 | NULL |
| 37916 | Andressa Aparecida dos Santos | andressasantos.dentista@gmail.com | +55 44 988231648 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:48 | NULL |
| 16415 | Angela Loureiro de Sousa | als.aloureiro@gmail.com | 59176349747 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:10:02 | NULL |
| 37927 | Angélica Trento frasson | angelica1234trento@gmail.com | 5545999078388 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:51 | NULL |
| 37932 | Anna Clara Estevam Menezes | anna.c.e.menezes@gmail.com | +55 44 999330251 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:52 | NULL |
| 37944 | Any Caroline Siqueira Tamagnini | any.tamagnini@hotmail.com | +55 44 999470756 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:18 | NULL |
| 38732 | Arissa Ayumi Okabayashi | arissaokabayashi@gmail.com | 5544999052609 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-24 13:44:05 | NULL |
| 37922 | B�rbara Regina Minuceli | barbara-minuceli@hotmail.com | +55 44 998699129 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:49 | NULL |
| 38749 | Bárbara Cristina Alberton | barbaracristinaalberton@hotmail.com | +55 45 99832-5797 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:20 | NULL |
| 38915 | Beattriz Wessling Angioletti Gueller | beattrizreserva@outlook.com | +55 47 98400-1556 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:24:58 | NULL |
| 37950 | Bianca Poletto Paes | Bianca.polettosantos@gmail.com | +55 44 999886697 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:19 | NULL |
| 31810 | Brenda Suellen Lopes | brendasulp@outlook.com | 5544991080302 | Cortesia Alunos Especializações | 0 | months | active | 2025-07-08 12:14:28 | NULL |
| 37924 | Camila Abdala Talarico | camilatalarico@hotmail.com | +55 44 998751057 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:50 | NULL |
| 16417 | Camila Cecon Chiesa | camila_chiesa@outlook.com | 5549988210493 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:10:54 | NULL |
| 38914 | Camila Montresor | camilamontresor556@gmail.com | +55 66 99912-1080 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:24:57 | NULL |
| 32792 | Camila Paulino Tesolin | harmonite@outlook.com | 5544991169471 | Cortesia Alunos Especializações | 0 | months | active | 2025-08-22 14:21:11 | NULL |
| 16433 | Camilly schaefer luiz | camillyschaefer@gmail.com |  | Cortesia Alunos Especializações | 0 | months | active | 2024-02-08 11:33:41 | NULL |
| 38920 | Carime Henrique Barboza | carimehb@yahoo.com.br | 5544998776725 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:28:22 | NULL |
| 38761 | Caroline Oliveira Hernandes | caroline.h@edu.unipar.br |  | Cortesia Alunos Especializações | 0 | months | active | 2026-03-24 13:51:19 | NULL |
| 38812 | Cibele Borges Hanusch | ci_borgess@yahoo.com.br | 5544991347669 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-08 16:48:51 | NULL |
| 37921 | Cristiane Consolin Ciriaco | zutiaconsolin@hotmail.com | +55 44 999264829 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:49 | NULL |
| 37928 | Daiane aparecida Soares Rosa | Daiane.soares.odont@gmail.com | +55 45 998374649 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:51 | NULL |
| 10128 | Daniela Fuzinatto Fernandes | dani_fuzinatto@hotmail.com |  | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:11:23 | NULL |
| 38916 | Deborah Teixeira Rocha dos Santos | deborahtrsantos@gmail.com | +55 11 99973-3012 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:24:58 | NULL |
| 37914 | DELCIO RUIZ BARBOSA | delrbarbosa@hotmail.com | +55 67 999766113 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-24 13:45:07 | NULL |
| 38917 | Edith Clari | egclari@gmail.com | +595 981 555 148 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:24:59 | NULL |
| 37925 | Eduarda Texeira Ferreira | dudalinque@gmail.com | +55 44 999404869 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:50 | NULL |
| 38755 | Eduardo Albanezi Cioni | eduardo.cioni@edu.unipar.br | +55 44 99933-9251 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:22 | NULL |
| 37933 | Eduardo Fuzeti Candian | odontologiafuzeticandian@gmail.com | 5543988518308 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:48:13 | NULL |
| 32791 | ELISE SASSO FACCIN | elisefaccin@gmail.com | 5551999171047 | Cortesia Alunos Especializações | 0 | months | active | 2025-08-22 14:16:17 | NULL |
| 37951 | ELLEN THAILY MODOS DE FARIA | ellenthaily12@gmail.com | +55 44 999641996 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:19 | NULL |
| 16422 | Eloir scariot Júnior | eloirscariot@hotmail.com | 5567996470612 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:29:41 | NULL |
| 16419 | Emanoella de Oliveira Braga | emanoella.braga@gmail.com | 5541988429336 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:17:11 | NULL |
| 38756 | Fernanda Theodoro de Queiroz Lima | fernandafqlima@gmail.com | +55 64 98112-2523 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:22 | NULL |
| 38918 | Gabriela Meurer Pereira | gabi_meurer@hotmail.com | +55 48 99159-9399 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:24:59 | NULL |
| 34219 | Gabriela Pivatto | gabipivatto07@hotmail.com |  | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:29:25 | NULL |
| 38745 | Gabriella Pitelli Zanutto | zanuttopgabi@gmail.com | +55 45 99919-0812 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:20 | NULL |
| 38754 | Gisele Buchimann Galvão | giselebuchimann6@gmail.com | +55 45 99804-4042 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:21 | NULL |
| 32977 | Giselle Andreoli Leal | giselleandreoli@gmail.com | 5545999790860 | Cortesia Alunos Especializações | 0 | months | active | 2025-09-16 12:56:59 | NULL |
| 4226 | Guilherme Machado Oliveira | gmo_odonto@yahoo.com | 37999685559 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:29:21 | NULL |
| 38744 | Heloise Thereza Picinini | heloise.odonto@gmail.com | +55 45 99990-3360 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:19 | NULL |
| 37913 | Ingrid Aparecida dos Santos | ingridcidinha@gmail.com | +55 43 996374190 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:47 | NULL |
| 16346 | Isabela Alice Stela | isabelastela@homail.com | 43999085747 | Cortesia Alunos Especializações | 0 | months | active | 2025-07-08 12:15:26 | NULL |
| 37919 | Isabela de Almeida Cezar seneme | isabelaacseneme@gmail.com | +55 44 998430141 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:49 | NULL |
| 37912 | Isabela Ferreira de Souza | isabelaferreiradesouza0102@gmail.com | +55 44 35234517 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:47 | NULL |
| 37918 | Isabella Cristina Machado Beraldo | isabellamachado_@outlook.com | +55 44 998659689 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:49 | NULL |
| 37946 | Isadora Purceno | isadorapurceno@hotmail.com | +55 43 996183811 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:18 | NULL |
| 7298 | Isadora Zani Cardoso | isadora_zani@hotmail.com | 43996463121 | Cortesia Alunos Especializações | 0 | months | active | 2024-04-11 20:47:47 | NULL |
| 38752 | Isis Pietra de Almeida Cogo | isispcogo@hotmail.com | +55 45 99803-1022 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:21 | NULL |
| 36591 | Izadora Zago Gali Rodrigues | zagoizadora@gmail.com | 5544984580898 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:47:13 | NULL |
| 37915 | Jennifer Kessia Berto Peixoto | jennikessia@hotmail.com | +55 44 997658273 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:48 | NULL |
| 37953 | Jessica Fernanda da Conceição Passaréli | jfernandaodonto@gmail.com | 5544997412393 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:20 | NULL |
| 38742 | Joice Aparecida Caroni Bender | joiceaparecidacaroni@gmail.com | +55 44 99927-7191 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:19 | NULL |
| 16868 | Júlia Mendes Dianin | juliadianin@hotmail.com | 44997021890 | Cortesia Alunos Especializações | 0 | months | active | 2024-04-11 20:50:19 | NULL |
| 16347 | Julia Nakatani Kunioka | jukunioka@gmail.com | 45999356417 | Cortesia Alunos Especializações | 0 | months | active | 2025-07-08 12:16:04 | NULL |
| 32779 | Juliana mograo Manne | ju_manne@hotmail.com | 5517991815558 | Cortesia Alunos Especializações | 0 | months | active | 2025-08-22 13:22:05 | NULL |
| 31315 | Karina da Costa de Queiroz | karinaqueiroz@terra.com.br | 5519983736312 | Cortesia Alunos Especializações | 0 | months | active | 2025-07-03 20:37:04 | NULL |
| 16420 | Karina de Oliveira Esteves Cruvinel | esteveskarina@hotmail.com | 55 35991830997 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:17:35 | NULL |
| 32783 | karine Osório Machado | karinedametto@gmail.com | 5553999691819 | Cortesia Alunos Especializações | 0 | months | active | 2025-08-22 13:34:21 | NULL |
| 32780 | Karine Scandolara | drakarinescandolara@gmail.com | 5551995999879 | Cortesia Alunos Especializações | 0 | months | active | 2025-08-22 13:23:43 | NULL |
| 37949 | Kaylane Pelais Santos | pelaiskaylane@gmail.com | +55 44 998037388 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:19 | NULL |
| 8196 | Keila Boaro Calegari | keilaboaro@hotmail.com | 5546999750478 | Cortesia Alunos Especializações | 0 | months | active | 2025-08-22 14:16:48 | NULL |
| 38758 | Larissa Ap da Silva Roseni | larissaroseni14@gmail.com | +55 67 99138-2306 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:22 | NULL |
| 37958 | Larissa Castanheira Feitosa | laricfeitosa2@gmail.com | 5544999993685 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-06 19:04:15 | NULL |
| 16348 | Laura Alves Silos | lauraalvessilos@hotmail.com | 5562999091179 | Cortesia Alunos Especializações | 0 | months | active | 2025-07-08 12:16:42 | NULL |
| 6840 | Letícia Lameu Costa | lameu.leticia@gmail.com | 5544999124666 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:30:36 | NULL |
| 10276 | Letícia salomao hirsch | leticiahirsch@hotmail.com | 5553991023434 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:27:29 | NULL |
| 32793 | Letticia Krystell Peres Texeira Zan | letticia_krystell@hotmail.com | 5565992218705 | Cortesia Alunos Especializações | 0 | months | active | 2025-08-22 14:22:32 | NULL |
| 37930 | Lissandra Almeida Willers | Lissandra_willers@hotmail.com | +55 45 991437136 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:52 | NULL |
| 38757 | Lorena de Carlo Andrade | lorenaandrade16@outlook.com | +55 43 99150-6330 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:22 | NULL |
| 38743 | Lucas Lazarini Saragioto | lucas.saragioto@hotmail.com | +55 44 99956-6220 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:19 | NULL |
| 37926 | Luciana Alice da Silva | Lucianaaliceds@gmail.com | +55 44 998843370 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:51 | NULL |
| 32974 | Luciana Bonfim dos Santos | lubonfim1@hotmail.com | 5543996036816 | Cortesia Alunos Especializações | 0 | months | active | 2025-09-16 12:53:28 | NULL |
| 39282 | Maira Lopes Eising | mairale2001@gmail.com |  | Cortesia Alunos Especializações | 0 | months | active | 2026-06-22 18:20:36 | NULL |
| 38751 | Maria Fernanda Braga Domingues | bragadmariafernanda@gmail.com | +55 44 99893-8753 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:21 | NULL |
| 37929 | Maria Rita Gasparello | gasparellomariarita@gmail.com | +55 44 998346194 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:51 | NULL |
| 7440 | Mariana Lopes da Silva | maarilopess99@gmail.com |  | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:49:00 | NULL |
| 38748 | Mariana Piotrowski Santos | marianapiotro@hotmail.com | +55 45 99975-2210 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:20 | NULL |
| 9735 | Marjorie Bin | ma.gbin@hotmail.com | +55 43996338597 | Cortesia Alunos Especializações | 0 | months | active | 2025-08-22 13:15:16 | NULL |
| 38746 | Milena Pegorini Aguayo | milenapegorini98@gmail.com | +55 45 98829-4262 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:20 | NULL |
| 37945 | Millene Lima de Oliveira | millenelimadeoliveira@gmail.com | +55 44 991397720 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:18 | NULL |
| 6116 | Naiara Penteado | naiarapenteado@yahoo.com.br |  | Cortesia Alunos Especializações | 0 | months | active | 2025-07-03 20:33:50 | NULL |
| 37917 | NATALIA AMENDOA | natalia_amendoa@hotmail.com | +55 44 998123463 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:48 | NULL |
| 8891 | NATHALIA BRESSAN FONTANA | nathaliafont@gmail.com | 5548991381811 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:32:50 | NULL |
| 37943 | Nathana Azanha Abade | nathana@azanha.com.br | +55 44 999924728 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:18 | NULL |
| 7472 | Pablo Castillo Gallegos | pablillexa@gmail.com | 56954694258 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:27:03 | NULL |
| 38750 | Patricia Basso | patricia7basso@gmail.com | +55 44 99983-5360 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:21 | NULL |
| 16424 | Poliana Gaona Bonetti | poli_gaona@hotmail.com | 5566999857220 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:33:13 | NULL |
| 37931 | Rafaella Gomes Storer | rafaellastorer@hotmail.com | +55 44 999108354 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:52 | NULL |
| 37920 | Rafaella Parpinelli Zamarioli | rafazamarioli@gmail.com | +55 14 996623356 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:40:49 | NULL |
| 18241 | Renata Aoki | renataaoki@hotmail.com | 55 45991437094 | Cortesia Alunos Especializações | 0 | months | active | 2024-06-06 17:20:35 | NULL |
| 32781 | RENATA FICINSKI SULIANI | renataficinski@hotmail.com | 5542991322012 | Cortesia Alunos Especializações | 0 | months | active | 2025-08-22 13:30:31 | NULL |
| 32790 | Renata Rodrigues Salazar | renatasalazardentista@gmail.com | 5551999724459 | Cortesia Alunos Especializações | 0 | months | active | 2025-08-22 14:14:55 | NULL |
| 38753 | Rocio Mabel Larroza Lugo | rociolarroza23@gmail.com | +595 981271606 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:21 | NULL |
| 16369 | ROGGER RICIERI MALDONADO OLIVEIRA | roggergama@hotmail.com | 554436762569 | Cortesia Alunos Especializações | 0 | months | active | 2025-03-18 19:26:47 | NULL |
| 16867 | Rosemeire Castellari Estefani Nespolo | castellarirosimeire@hotmail.com |  | Cortesia Alunos Especializações | 0 | months | active | 2024-04-11 20:47:04 | NULL |
| 38747 | Tamires Saragioto Pialarissi | pialarissitamires@gmail.com | +55 44 99745-2156 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-23 14:44:20 | NULL |
| 38912 | Tânia Mara Martinez Franco Nicolau | drataniafranco@gmail.com | +55 19 99410-9460 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:24:56 | NULL |
| 1237 | Tatiana da Costa Moradir | tatianac.morador@gmail.com |  | Cortesia Alunos Especializações | 0 | months | active | 2026-03-02 16:44:10 | NULL |
| 37952 | Taynara Rita Krauchuk dos Santos | tayrita94@gmail.com | +55 42 984029400 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:20 | NULL |
| 37947 | Thais Gabrieli Costa Grejianim | thaisgabrieligreji@gmail.com | +55 67 999530666 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-04 19:44:19 | NULL |
| 16351 | Thiago Ronnie Valduga | thiago_valduga99@hotmail.com | 5549999572886 | Cortesia Alunos Especializações | 0 | months | active | 2025-07-08 12:17:17 | NULL |
| 3433 | Thiago Santos Mendes | mendesodontologia@outlook.com | 5592981012600 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:34:53 | NULL |
| 38686 | Valéria Maldonado | clinica.cruzeiro9@gmail.com | 5544984093878 | Cortesia Alunos Especializações | 0 | months | active | 2026-03-13 17:54:02 | NULL |
| 38919 | Vanessa Cuman de Castro | vanessacuman@bol.com.br | 5541991826266 | Cortesia Alunos Especializações | 0 | months | active | 2026-04-29 17:27:31 | NULL |
| 16426 | Vitor Gussen Bastos | Vitorgussen_bastos@hotmail.com | 55 37998591100 | Cortesia Alunos Especializações | 0 | months | active | 2024-02-06 12:35:12 | NULL |
| 9463 | Acácio Fuziy | acaciofuziy2@gmail.com | 5514997611559 | Cortesia Autores | 7800 | months | active | 2026-04-06 20:54:18 | NULL |
| 3081 | Alberto Consolaro | consolaro@uol.com.br | 5514981318756 | Cortesia Autores | 7800 | months | active | 2024-03-04 17:49:21 | NULL |
| 8580 | Comunicação Dentalpres | comunicacao5@dentalpress.com.br | 554430339823 | Cortesia Autores | 7800 | months | active | 2025-01-21 12:56:58 | NULL |
| 6328 | Fernando Marson | fernandomarson14@hotmail.com |  | Cortesia Autores | 7800 | months | active | 2023-12-14 19:39:59 | NULL |
| 10121 | Janaina | cursos2@dentalpress.com.br |  | Cortesia Autores | 7800 | months | active | 2023-01-31 13:24:59 | NULL |
| 2380 | JOSÉ AUGUSTO MENDES MIGUEL | jamiguel66@gmail.com | 552122260024 | Cortesia Autores | 7800 | months | active | 2025-12-18 18:03:10 | NULL |
| 3056 | Marcio Almeida | marcioralmeida@uol.com.br | 5514981219101 | Cortesia Autores | 7800 | months | active | 2025-07-08 13:31:11 | NULL |
| 3906 | Marden Oliveira Bastos | drmarden@icloud.com | 55 37999551100 | Cortesia Autores | 7800 | months | active | 2026-02-25 14:39:38 | NULL |
| 20506 | Matheus Moreira | comunicacao2@dentalpress.com.br |  | Cortesia Autores | 7800 | months | active | 2024-10-01 19:27:03 | NULL |
| 19273 | Rafael Teste Ti | tiTeste@gmail.com | 5544999428200 | Cortesia Autores | 7800 | months | active | 2024-12-13 17:12:46 | NULL |
| 33584 | Rodrigo Silveira Tosta Figueiredo | rodrigotostaf@gmail.com |  | Cortesia Autores | 7800 | months | active | 2025-10-23 20:47:35 | NULL |
| 2077 | Sergei Godeiro Fernandes Rabelo Caldas | sergei.rabelo@ufrn.br | 55 84991579228 | Cortesia Autores | 7800 | months | active | 2023-04-24 14:30:25 | NULL |
| 1030 | Teste | teste@hotmail.com |  | Cortesia Autores | 7800 | months | active | 2026-03-10 13:48:01 | NULL |
| 15902 | Thiago Teste | thiagomoss88@gmail.com | 554499999999 | Cortesia Autores | 7800 | months | active | 2024-07-23 16:53:38 | NULL |
| 19624 | User Teste Real | userteste@gmail.com |  | Cortesia Autores | 7800 | months | active | 2025-08-05 13:08:48 | NULL |
| 15338 | Wendel Shibasaki | wendel@shibasakis.com |  | Cortesia Autores | 7800 | months | active | 2026-03-18 11:39:31 | NULL |
| 3592 |  | adriano@imondelli.com |  | Cortesia Dental Press | 0 | months | active | 2026-06-12 21:00:10 | NULL |
| 32902 | Bruna Alves | dra.bruorto2025@gmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-09-04 19:22:04 | NULL |
| 22309 | Bruna Denzer Tholken | Bruna.tholken02@gmail.com | 5545988276846 | Cortesia Dental Press | 0 | months | active | 2025-03-18 19:32:59 | NULL |
| 443 | Bruno Furquim | brunofurquim@hotmail.com | 5544999772026 | Cortesia Dental Press | 0 | months | active | 2023-01-27 19:28:43 | NULL |
| 39172 | Bruno Gustavo Cavalcante da Fonseca | brunogcfonseca@hotmail.com |  | Cortesia Dental Press | 0 | months | active | 2026-06-08 11:16:59 | NULL |
| 8785 | CAMILA DE ATAIDE FERRAZ FELIPE | camilaferraz14@hotmail.com | 55 85988871400 | Cortesia Dental Press | 0 | months | active | 2025-09-02 17:30:33 | NULL |
| 1364 | Carla King | carla.king@hotmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-09-03 18:17:30 | NULL |
| 7598 | Claudia I.Baroni Ragazzi | baroniragazzi@yahoo.com.br | 5514997731791 | Cortesia Dental Press | 0 | months | active | 2026-04-14 20:38:08 | NULL |
| 2683 | Daianne  G Gobbe | daiannegobbe@hotmail.com | 5544999220600 | Cortesia Dental Press | 0 | months | active | 2025-03-13 14:28:28 | NULL |
| 33076 | Dandhara Torres | dandhatorres@gmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-09-25 10:18:23 | NULL |
| 37894 | davi gomes | davi.gomes@midhaus.com.br |  | Cortesia Dental Press | 0 | months | active | 2026-02-23 12:23:27 | NULL |
| 37905 | Deizy | deizydmm@hotmail.com | 4488280675 | Cortesia Dental Press | 0 | months | active | 2026-02-25 12:08:33 | NULL |
| 34372 | Edimara Domingues Ferreira | edimara.dominguesf@gmail.com | 55 47996167698 | Cortesia Dental Press | 0 | months | active | 2026-06-22 14:30:38 | NULL |
| 22308 | Emanuelle Rayane Salamon | emanuelle.salamon@edu.unipar.br | 5567996923399 | Cortesia Dental Press | 0 | months | active | 2025-03-18 19:31:56 | NULL |
| 20640 | Emily Lima | emilymoura@outlook.com | 5555719964355 | Cortesia Dental Press | 0 | months | active | 2026-03-18 14:14:13 | NULL |
| 15971 | FREDERICO CARRARA CAMPOS | frederico.carrara@gmail.com | 3199756591 | Cortesia Dental Press | 0 | months | active | 2026-05-11 17:25:56 | NULL |
| 16940 | GABRIEL CASAGRANDE | drgcasagrande@gmail.com |  | Cortesia Dental Press | 0 | months | active | 2024-08-30 14:15:39 | NULL |
| 33150 | Gabriel da Cruz Reis | gabrieldacruzreis@gmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-10-08 13:01:31 | NULL |
| 8019 | Gastão Moura | gastaomoura@hotmail.com | +55 14 99772-8280 | Cortesia Dental Press | 0 | months | active | 2026-03-24 18:07:11 | NULL |
| 22310 | Giovanna Oliveira Ceranto | giovanna.ceranto@edu.unipar.br | 5544999187575 | Cortesia Dental Press | 0 | months | active | 2025-03-18 19:33:47 | NULL |
| 38846 | GISELLE CABRAL DA COSTA | gikosta@yahoo.com.br |  | Cortesia Dental Press | 0 | months | active | 2026-04-17 12:57:32 | NULL |
| 38975 | Heloaraujo1@live.com | Heloaraujo1@live.com |  | Cortesia Dental Press | 0 | months | active | 2026-05-07 18:53:00 | NULL |
| 32887 | Inessa Barbosa | inessabarbosaortodontia@gmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-09-02 19:45:42 | NULL |
| 32910 | Ingra Mendes de Medeiros | ingrammedeiros@hotmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-09-05 18:46:14 | NULL |
| 22306 | Izabela Thaís Ribeiro Hluchow Ferreira | izabelahluchow@gmail.com | 5544988261198 | Cortesia Dental Press | 0 | months | active | 2025-03-18 19:28:43 | NULL |
| 22307 | Jamile Guimarães Cortati | Jamilegcortati@gmail.com | 5544991228208 | Cortesia Dental Press | 0 | months | active | 2025-03-18 19:30:45 | NULL |
| 38983 | LEONARDO GONTIJO MATOS | leonardogontijomatos@gmail.com | 5534999750504 | Cortesia Dental Press | 0 | months | active | 2026-05-11 18:24:18 | NULL |
| 31889 | Livio Yoshinaga | livio@live.com | 5511963449691 | Cortesia Dental Press | 0 | months | active | 2025-07-15 22:03:30 | NULL |
| 22302 | Lorena Sayuri Nonaka Clemente | sayurilorena752@gmail.com | 5544999825012 | Cortesia Dental Press | 0 | months | active | 2025-03-18 19:22:21 | NULL |
| 22303 | Luana Tillmann de Matia | luanadematia@hotmail.com | 5545998372234 | Cortesia Dental Press | 0 | months | active | 2025-03-18 19:23:40 | NULL |
| 32899 | Luiz Guilherme Pinheiro | luizgpinheiro@gmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-09-04 19:10:54 | NULL |
| 8013 | Maiara Luisa Duque Cabral | maikabral@hotmail.com | 5537999065926 | Cortesia Dental Press | 0 | months | active | 2025-08-27 19:50:37 | NULL |
| 39110 | MARCELO CALAIS AYRES | mcayres@bol.com.br | 5531988063091 | Cortesia Dental Press | 0 | months | active | 2026-05-25 12:59:51 | NULL |
| 22304 | Maria Eduarda Moraes Paiva | mariaempaiva@gmail.com | 5545999449305 | Cortesia Dental Press | 0 | months | active | 2025-03-18 19:24:39 | NULL |
| 15477 | Maria Teresa Cattebeke | maritecattebeke@hotmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-11-28 16:58:59 | NULL |
| 33601 | Mariana Mesquita Ferreira | marianamesf@hotmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-10-29 18:05:00 | NULL |
| 32901 | Odara Ventura | odaraventura@gmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-09-04 19:16:15 | NULL |
| 10865 | OMD DentalPress | omddentalpress@gmail.com |  | Cortesia Dental Press | 0 | months | active | 2023-05-09 17:16:06 | NULL |
| 39097 | Ozéias Rodrigues | administrativo@poprev.com.br |  | Cortesia Dental Press | 0 | months | active | 2026-05-19 18:50:08 | NULL |
| 20398 | Patricia Ferreira | patriciaferreira3232@gmail.com |  | Cortesia Dental Press | 0 | months | active | 2024-09-12 13:36:35 | NULL |
| 38984 | PAULO CESAR RIBEIRO | drpauloribeiro.odontopediatra@gmail.com | 5549999075979 | Cortesia Dental Press | 0 | months | active | 2026-05-11 18:23:46 | NULL |
| 4430 | Rachel Marson | quelfurquim@hotmail.com | 5544999185164 | Cortesia Dental Press | 0 | months | active | 2024-07-10 13:45:19 | NULL |
| 33217 | Roció Costa | rocioacosta1000@gmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-10-16 19:11:13 | NULL |
| 8417 | Rodrigo Almada | rodrigoalmada@gmail.com | 553192470141 | Cortesia Dental Press | 0 | months | active | 2026-05-20 13:32:01 | NULL |
| 2579 | Rogeria | atendimento4@dentalpress.com.br | 554430339830 | Cortesia Dental Press | 0 | months | active | 2024-08-01 13:20:06 | NULL |
| 5796 | Roseneide Martins | comercial@dentalpress.com.br | 554430339819 | Cortesia Dental Press | 0 | months | active | 2021-07-08 14:49:29 | NULL |
| 22305 | Said Khalil Fayad | fayadsaiddd@hotmail.com | 5545991258841 | Cortesia Dental Press | 0 | months | active | 2025-03-18 19:26:19 | NULL |
| 4552 | Sandra Stival dos Santos Lemes | sandrastival2@gmail.com | 5562996791008 | Cortesia Dental Press | 0 | months | active | 2026-04-22 12:29:01 | NULL |
| 32836 | Tamires Belo | tami_belo@hotmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-08-27 19:50:11 | NULL |
| 32900 | Vinícius Leite | drviniciusortoexames@gmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-09-04 19:12:27 | NULL |
| 32835 | Vivian Graziele Toledo Almeida | vglt@hotmail.com |  | Cortesia Dental Press | 0 | months | active | 2025-08-27 19:30:36 | NULL |
| 39135 | Alanna Cristina da Silva | alanna.cristina@sereducacional.com |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:20 | NULL |
| 39133 | Amanda de Andrade Marques | amanda.andrade@unijuazeiro.edu.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:20 | NULL |
| 39163 | Ana Scocate | ana.scocate@prof.ung.br |  | Cortesia Professores | 7800 | months | active | 2026-06-01 19:20:51 | NULL |
| 39136 | Bárbara Brasil Santana | barbara.brasil@unama.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:21 | NULL |
| 4479 | Carlos Araujo | carlosaugusto.odonto@gmail.com |  | Cortesia Professores | 7800 | months | active | 2026-05-07 19:37:43 | NULL |
| 39127 | Carolina Pereira Tavares | odontologia.alianca@mauriciodenassau.edu.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:19 | NULL |
| 8808 | CAUBY MAIA CHAVES JUNIOR | cmcjr@uol.com.br | 558532722372 | Cortesia Professores | 7800 | months | active | 2025-09-12 14:30:01 | NULL |
| 39129 | Djokaeff Aquino Ferreira | djokaeff.ferreira@uninassau.edu.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:19 | NULL |
| 39139 | Eliane Queiroz | 280600147@prof.sempreung.com.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:21 | NULL |
| 39131 | Fabrício de Medeiros Melo | odontologia.arapiraca@uninassau.edu.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:19 | NULL |
| 4505 | FABRICIO PINELLI VALARELLI | fabriciovalarelli@gmail.com | 5514991110001 | Cortesia Professores | 7800 | months | active | 2026-05-08 16:50:53 | NULL |
| 39138 | Felipe Bonacina | 280600531@prof.sempreung.com.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:21 | NULL |
| 22235 | Guilherme Paladini Feltrin | drguilhermepaladini@gmail.com |  | Cortesia Professores | 7800 | months | active | 2026-03-19 17:25:51 | NULL |
| 4896 | Hélio HIssashi Terada | helioterada@gmail.com | 44999727498 | Cortesia Professores | 7800 | months | active | 2025-10-31 11:50:58 | NULL |
| 39130 | Izabella Maria Barbosa da Silva | izabella.barbosa@uninassau.edu.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:19 | NULL |
| 39162 | Jamil Awad Shibli | jshibli@ung.br |  | Cortesia Professores | 7800 | months | active | 2026-06-01 19:21:19 | NULL |
| 39132 | Lavoisiana Lacerda de Lucena | lavoisiana.lacerda@sereducacional.com |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:20 | NULL |
| 39142 | Leila Vaz da Silva | academico.bh@uninassau.edu.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:36:24 | NULL |
| 39128 | LUCAS MELO DA COSTA | lucas.costa@uninassau.edu.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:19 | NULL |
| 39161 | Luciene Figueiredo | luciene.figueiredo@prof.ung.br |  | Cortesia Professores | 7800 | months | active | 2026-06-01 19:19:10 | NULL |
| 6497 | Luiz Junior | juniorfranja@hotmail.com |  | Cortesia Professores | 7800 | months | active | 2026-05-25 15:01:42 | NULL |
| 39134 | Milana Drumond Ramos Santana | milana@unijuazeiro.edu.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:20 | NULL |
| 5611 | Paulo Rossato | paulo.rossato@outlook.com | 5543984060200 | Cortesia Professores | 7800 | months | active | 2026-05-04 12:10:43 | NULL |
| 6180 | Renato Parsekian Martins | dr_renatopmartins@hotmail.com | 5516981166000 | Cortesia Professores | 7800 | months | active | 2026-01-20 13:33:45 | NULL |
| 9551 | Roberto Shimizu | robertoshimizu@yahoo.com.br | 5541984068000 | Cortesia Professores | 7800 | months | active | 2026-03-24 19:50:53 | NULL |
| 39141 | Rogerio Pereira Xavier | rogerio.xavier@sereducacional.com |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:22 | NULL |
| 6653 | Rosely Suguino | roselysuguino7@gmail.com | 5544999735676 | Cortesia Professores | 7800 | months | active | 2025-07-18 19:05:22 | NULL |
| 39140 | Simone Bergamo | simone.bergamo@sereducacional.com |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:21 | NULL |
| 39137 | Veronica Batista Santana | veronica.santana@ung.br |  | Cortesia Professores | 7800 | months | active | 2026-05-28 20:34:21 | NULL |
| 38728 | Yuri Neiman | reitoria@ung.br |  | Cortesia Professores | 7800 | months | active | 2026-06-01 19:18:29 | NULL |
| 15670 | Adriana Vitoriano | avitodontologia@gmail.com | 55 11994887077 | Dental GO | 8900 | months | active | 2023-11-11 10:54:21 | NULL |
| 8030 | Emerson Souza da Silva | ortodontiaemerson@yahoo.com.br | 55 55999437884 | Dental GO | 8900 | months | active | 2023-09-19 10:46:38 | NULL |
| 4195 | GIRLAINNY DAMASCENA | girlainny@gmail.com | 55 69984578088 | Dental GO | 8900 | months | active | 2023-11-11 08:37:37 | NULL |
| 417 | Marina Lucia Cumerlato | marina.cumerlato@gmail.com | +55 54999969527 | Dental GO | 8900 | months | active | 2022-04-18 15:02:19 | NULL |
| 7580 | Alicia Zhong | azhong02@gmail.com | 55 14999097464 | Dental GO Anual R$48,00 | 4800 | months | active | 2023-11-30 19:29:42 | NULL |
| 7659 | Jesús Ramón Cedeño Escobar | jrce26@hotmail.com | 526391924808 | Dental GO Anual R$48,00 | 4800 | months | active | 2023-10-26 14:11:54 | NULL |
| 1454 | Adriano Perez Rebucci | corconvenio@uol.com.br | 5515997817088 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-02-12 19:44:48 | NULL |
| 22195 | Amanda Ferreira | draamanda.fe@gmail.com | 5573982224132 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-03-27 15:53:21 | NULL |
| 37737 | Andrea Rocha | adrorto@yahoo.com.br |  | Dental GO Anual R$78,00 | 7800 | months | active | 2026-02-04 17:30:15 | NULL |
| 33583 | Andréia Ramos | andreiacsramos96@gmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2025-10-23 19:05:08 | NULL |
| 14673 | ANNANDA PINHEIRO MARTINS | martins.annanda@gmail.com | 5527998367875 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-04-10 20:20:34 | NULL |
| 32978 | Antonio Gomes Henriques | henriquesodontologia@gmail.com | 5519997741375 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-09-16 13:53:42 | NULL |
| 32308 | Beverli Tadioto Paschoal | beverliodontologia@gmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2025-08-11 17:30:47 | NULL |
| 3142 | BRUNA GABRIELA KOTAKE OLIVEIRA | brunakotake@gmail.com | 5518988189007 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-01-16 12:51:50 | NULL |
| 1479 | Carlos Chenu | drcarlosgreco@gmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2025-09-16 19:26:25 | NULL |
| 22830 | Caroline Marqui Dantas | c.marqui08@gmail.com | 5511974799230 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-06-22 13:51:15 | NULL |
| 31937 | Cristiane Rodrigues | cristianemonteiro24b@gmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2025-07-21 17:41:10 | NULL |
| 38440 | DANIELI GONZALEZ SANTOS CAPPELLESSO | dentistadanieligonzalez@gmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2026-03-11 14:05:42 | NULL |
| 33585 | Danielle elias fernandes paulino | danielleefpaulino@gmail.com | 5534992205428 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-03-25 16:45:40 | NULL |
| 20676 | Danlyne Eduarda Ulisses de Queiroga | qdanlyne@gmail.com | 5581999320941 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-05-29 19:40:35 | NULL |
| 1 | Developer | developer@dentalgo.com.br |  | Dental GO Anual R$78,00 | 7800 | months | active | 2026-02-02 19:38:33 | NULL |
| 38447 | Diego Pabón | depabon22@hotmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2026-03-12 20:02:07 | NULL |
| 1114 | Eliane Serpa | elianeserpa@yahoo.com.br | 555599614222 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-10-06 20:29:50 | NULL |
| 33163 | Estefanía Muñoz Luna Victoria | estefania1921@icloud.com | 51 977873692 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-10-09 19:08:37 | NULL |
| 32390 | FAIT | fait@periodicals.com.br | 55 1239554455 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-08-19 14:41:08 | NULL |
| 15045 | FERNANDA APARECIDA CAINELLI SANCHES | facsanches@hotmail.com | 1697925723 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-06-16 13:15:13 | NULL |
| 1586 | Fernando Manhaes | fernando@fmanhaes.odo.br | 5519981231500 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-06-25 14:58:04 | NULL |
| 33040 | Flavia Lacerda | draflavialacerdamd@gmail.com | 351910157668 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-09-23 20:50:25 | NULL |
| 8112 | FRANCISCO DE ASSIS ROMEIRO | assisromeiro3@gmail.com | 5519982951414 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-09-16 14:32:45 | NULL |
| 5712 | Gabriel Vieira Pim | gabriel_pim_@hotmail.com | +55 27998935507 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-06-19 20:23:12 | NULL |
| 10792 | Gabriella Mota Assunção Galasse | dragabriellagalasse@gmail.com | 5511999001409 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-02-10 17:57:49 | NULL |
| 6200 | Giovana Pimenta | gio.pimenta@uol.com.br |  | Dental GO Anual R$78,00 | 7800 | months | active | 2026-05-18 11:43:52 | NULL |
| 3121 | Giovana Rembowski Casaccia | giocasaccia@gmail.com | 5551999111013 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-06-11 15:02:45 | NULL |
| 2383 | Giovanni Carvalho | giovannicetro@gmail.com | 5531991030355 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-02-18 20:33:05 | NULL |
| 8121 | Gregorio Bonfim Dourado | drgregoriodourado@outlook.com | 5577999909444 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-06-02 18:09:28 | NULL |
| 20419 | GUILHERME ANTONIO DE OLIVEIRA LIMA | guilhermeorto@hotmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2025-06-23 19:51:35 | NULL |
| 6205 | Guilherme Sousa Resende | guilhermesousaodonto@gmail.com | 5535988090796 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-06-15 20:23:57 | NULL |
| 4671 | Gustavo Favarato Ruy | drgustavoruy@gmail.com | 5527999742343 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-07-07 12:43:55 | NULL |
| 38768 | HD SERVIÇOS EM SAUDE E ODONTOLOGIA LTDA | clinicahdj@hotmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2026-03-26 10:50:00 | NULL |
| 39184 | Iasmin Alves Ferreira | iasminalves.ferreira@hotmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2026-06-11 18:26:07 | NULL |
| 6872 | Ivan Pedro Taffarel | ivan@ortodontiataffarel.com.br | 55984067179 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-03-25 12:45:36 | NULL |
| 7368 | Juliana de Oliveira Romanelli Abi Faraj | juliana.romanelli@uol.com.br | 5511999968675 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-09-10 17:50:16 | NULL |
| 5580 | Julyano Vieira da Costa | julyanovieira@gmail.com | 5544991265822 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-06-24 20:10:04 | NULL |
| 38903 | Lethicia de Souza Zerial | zeriallethicia@gmail.com | 556792480626 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-04-27 19:38:54 | NULL |
| 18276 | Lucas Bastos Cruvinel | lucascruvinel.orto@gmail.com | 5519997292808 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-09-12 18:56:55 | NULL |
| 15333 | Luciana Borret Florencio | luborret@gmail.com | 5521987886266 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-08-11 16:11:57 | NULL |
| 8291 | Luís Antônio de Arruda Aidar | luisaidar@uol.com.br | 5513981581555 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-07-14 20:08:52 | NULL |
| 33692 | Manoel Ferreira | manoellorenzo@hotmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2025-11-14 19:43:21 | NULL |
| 8437 | MARCO VINICIO GONZALEZ NAVAS | marcogonzanavas@gmail.com | 593984657886 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-12-01 20:01:56 | NULL |
| 20531 | Maria Paula Barcelos | dramariapaulabarcelos@gmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2024-10-04 17:17:49 | NULL |
| 5797 | Maria Silvia Costa Garavini | silgaravini@hotmail.com | 5531999594746 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-08-28 12:23:53 | NULL |
| 39145 | Mariana Alvarenga | marianacamposalmeida09@gmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2026-05-29 12:51:04 | NULL |
| 1739 | Mariana de Pinho Noronha | mariananoronha@gmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2025-12-15 20:37:50 | NULL |
| 1352 | Mariane Azevedo Pereira | marianeazevedo@ortodontista.com.br | 5592981285077 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-11-27 20:12:36 | NULL |
| 738 | Murilo Sergio Principe Bizetto | princepebizetto@uol.com.br | 5542999789898 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-03-12 20:25:02 | NULL |
| 22162 | Natiele Sousa Ribeiro de Carvalho | eanatiele@hotmail.com | 5586999575787 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-06-15 14:26:25 | NULL |
| 16835 | Patricia María Ramos Campoverde | ortodonciapmrc@gmail.com | 593984489169 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-03-11 13:54:05 | NULL |
| 32384 | PAULO ROBERTO H KAPPEL | prkappel@gmail.com | 5551999823367 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-08-18 18:30:24 | NULL |
| 31295 | Raquel Praxedes | draraquelpzandona@gmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2025-07-02 12:08:28 | NULL |
| 33674 | Renan Almeida | rennan_almeida@hotmail.com | 92991406919 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-11-11 17:46:16 | NULL |
| 32923 | RENATA PRESTI ALVES | renatapresti@alumni.usp.br | 55 11986268225 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-09-09 13:42:12 | NULL |
| 30441 | Ruy Tamoyo Vendas Rodrigues Junior | ruyvendasrodrigues@gmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2025-07-30 13:21:33 | NULL |
| 4357 | Sergio Luiz de Azevedo Silva | sergioazevedo@hotmail.com | 5584994184838 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-04-27 14:31:49 | NULL |
| 15991 | shayeny fonseca teixeira | shayeny.teixeira@hotmail.com | 5591985200561 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-03-31 18:22:35 | NULL |
| 32943 | teste 2 10/09/2025 | testinho1234@gmail.com | 5544999999999 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-09-10 18:49:45 | NULL |
| 16435 | THIAGO SANTANA RIBEIRO | thiago.srib@hotmail.com | 5579998648752 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-03-17 15:12:31 | NULL |
| 560 | THIARA GUIMARÃES | tguimaraesm@gmail.com | 5573991130672 | Dental GO Anual R$78,00 | 7800 | months | active | 2026-06-22 14:00:42 | NULL |
| 1570 | VALESCA ALMEIDA DE CASTRO | nobreortodontia@gmail.com | 5531997600865 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-01-17 12:17:59 | NULL |
| 33806 | Victor Muniz | victorhugomuniz@hotmail.com |  | Dental GO Anual R$78,00 | 7800 | months | active | 2025-12-12 17:05:11 | NULL |
| 9385 | Willian Goulart Martins | willian.gmartins88@gmail.com | 5547997140470 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-09-15 20:22:29 | NULL |
| 3092 | Wislei de Oliveira | wdortho@yahoo.com.br | 5577779915005 | Dental GO Anual R$78,00 | 7800 | months | active | 2025-09-15 13:34:39 | NULL |
| 3662 | Abdias Telles da Silva Neto | abdiastelles@hotmail.com | 5592984144584 | Dental GO Anual R$89,00 | 8900 | months | active | 2025-08-01 12:17:04 | NULL |
| 33108 | Alejandra Patricia Avila Mier | avila.58891@gmail.com | 59175795992 | Dental GO Anual R$89,00 | 8900 | months | active | 2026-04-09 13:13:12 | NULL |
| 8405 | Associação de Ensino e Cultura de Mato Grosso | odontologia@aems.edu.br | 55 6721056060 | Dental GO Anual R$89,00 | 8900 | months | active | 2025-10-08 11:18:32 | NULL |
| 9191 | Centro de Estudos Octavio Dias de Oliveira | biblioteca@unigoyazes.edu.br | 55 6235069300 | Dental GO Anual R$89,00 | 8900 | months | active | 2025-08-13 16:37:54 | NULL |
| 6489 | Fabricio Monteiro de Castro Machado | fmcmachado2@gmail.com | 5544988230388 | Dental GO Anual R$89,00 | 8900 | months | active | 2025-09-30 12:17:14 | NULL |
| 20526 | Felipe Figueredo de Moraes | felipefdemoraes8@gmail.com |  | Dental GO Anual R$89,00 | 8900 | months | active | 2025-09-02 18:39:19 | NULL |
| 15983 | Flaviana Alves Dias | flavi_dias@hotmail.com | 55 43999251388 | Dental GO Anual R$89,00 | 8900 | months | active | 2025-10-27 20:16:55 | NULL |
| 31968 | Jose Antonio Giovanelli | antoniogiovanelli@bol.com.br |  | Dental GO Anual R$89,00 | 8900 | months | active | 2025-07-25 14:45:56 | NULL |
| 37729 | Mauricio | dr.mauricio.bertrami@uol.com.br |  | Dental GO Anual R$89,00 | 8900 | months | active | 2026-02-03 13:12:07 | NULL |
| 31964 | Rafael Kistenmacher | rkistenmacher@gmail.com |  | Dental GO Anual R$89,00 | 8900 | months | active | 2025-07-24 17:31:18 | NULL |
| 7155 | Vanessa Athayde Braga Falcao | vanessabragafalcao@gmail.com | +55 86 9568-1919 | Dental GO Anual R$89,00 | 8900 | months | active | 2026-01-15 13:04:13 | NULL |
| 4088 | Giovana Frigotto | gifrigotto@hotmail.com | +55 41 999258191 | Dental GO Black Friday 20% de Desconto  + Revista ... | 8200 | months | active | 2021-01-08 14:18:32 | NULL |
| 4305 | Nelly Sanseverino desativado | desativado1@desativado.com | 5511984688000 | Dental GO Black Friday 20% de Desconto  + Revista ... | 8200 | months | active | 2021-01-08 14:18:36 | NULL |
| 14432 | Douglas Escobar | drdouglasescobar2014@gmail.com |  | Dental GO Cortesia Revisores | 0 | months | active | 2026-04-27 19:03:35 | NULL |
| 9242 | Natália Gomes de Souza | nataliagomesdesouza@yahoo.com.br | +55 49991085530 | Dental GO Promocioal Estudantes - R$39,00 | 3900 | months | active | 2022-06-30 13:24:14 | NULL |
| 1043 | Adriana Haerber | adricristina.rocha@gmail.com |  | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2024-10-10 10:41:30 | NULL |
| 22047 | Amanda da Silva Ribeiro | amandaribeiro126367@gmail.com | 5511971712288 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-03-12 14:22:48 | NULL |
| 2626 | Ana Costa | ananmcosta@gmail.com | 5584988234220 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-05-11 13:12:24 | NULL |
| 33175 | Andrea Yleana Nobile Ganoza | andrea.nobile.290593@gmail.com | 51970751477 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-10-13 16:09:33 | NULL |
| 31856 | Aniella Cristina Sant Ana Gonçalves | aniellacristina1201@gmail.com | 55  55 27 99710-0409 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-07-12 19:57:53 | NULL |
| 10983 | Antônio José Marques Romano | ajromano72@hotmail.com | 5562996766677 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-02-16 11:29:40 | NULL |
| 17058 | Arthur Almeida Azevedo | arthur.odonto@hotmail.com | 55 91981786698 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2024-04-16 13:28:02 | NULL |
| 39086 | Bastian Ordenes | bordenesr@gmail.com | 56956173586 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-05-17 15:34:42 | NULL |
| 2339 | Beatriz | biamarinho@hotmail.com | 5585988814338 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-10-13 20:02:13 | NULL |
| 21628 | BRUNO ORELLANA | brunorellana@uol.com.br | 55 42991124040 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-01-15 19:08:52 | NULL |
| 37870 | carla mena | mena218@gmail.com | 51932270925 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-02-11 16:12:42 | NULL |
| 2213 | Christianne Custodio | chrisacustodio@gmail.com | 5521995593107 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-06-26 17:30:34 | NULL |
| 37970 | Cristina Martins Teixeira | crismt85@hotmail.com | 5548999710135 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-03-10 10:37:59 | NULL |
| 19696 | Debora Camilo | dradeboracamilo@gmail.com | 55 21988600389 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-11-16 02:12:17 | NULL |
| 9661 | Diogo Jardel Boff | diogojardelboff@icloud.com | +55 54981169797 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-06-23 14:21:19 | NULL |
| 2660 | Esdras Franca | esdrasodonto@gmail.com | 55 31988324880 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2024-06-11 01:31:32 | NULL |
| 32342 | Fabio Lazzari | fabiollazzari@gmail.com | 55 54996746954 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-08-13 21:20:04 | NULL |
| 21430 | Fellipe Figueiredo | fellipempf@gmail.com | 5575998710104 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-06-11 00:28:58 | NULL |
| 5133 | Fernando Stockler | stocklerf@gmail.com | 5524992358696 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-06-25 19:50:46 | NULL |
| 32340 | FLAVIA CURTY TEIXEIRA | flaviacurty28@gmail.com | 55 21993631519 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-08-13 21:00:00 | NULL |
| 39286 | Giovanna Moraes Casalenuovo | casalenuovogiovanna@gmail.com | 5565999972102 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-06-23 18:31:18 | NULL |
| 7220 | Hélio Venancio da Silva Jr. | ortovenancio@hotmail.com | 5534991368080 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-05-13 11:55:17 | NULL |
| 37875 | Jimmy Lopez | jilokle@gmail.com | 3131684022606 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-02-12 19:01:31 | NULL |
| 22230 | João lucas Gomes Dória | gomesdoriajoaolucas@gmail.com | 55 15997927428 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-03-12 15:46:14 | NULL |
| 39199 | João Stella | sorriacomarti@gmail.com | 5554999069275 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-06-12 11:35:46 | NULL |
| 9061 | JOSÉ ROBERTO ALVES MOREIRA | ortojrm@gmail.com | 5519983733333 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-02-10 19:32:21 | NULL |
| 9677 | Juan Francisco Mariscal Muñoz | jfrmm.mar@gmail.com | 523319113490 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-07-08 15:28:02 | NULL |
| 20425 | Juliana Moura Storniolo de Souza | justorniolo@yahoo.com.br | 55 14997155489 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-03-14 16:33:52 | NULL |
| 1480 | Kely Costa | kelysneves@uol.com.br |  | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-03-10 19:35:23 | NULL |
| 34348 | Lorena Fernandes | lorenafsodontologia@gmail.com | 5531995371121 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-01-13 17:42:23 | NULL |
| 10567 | Lorena Vilanova | vilanova.ortodontia@gmail.com | 5579999543885 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-06-13 20:52:15 | NULL |
| 6097 | Maira Massuia de Souza | mairamassuia@gmail.com | 55 99988338008 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-06-17 13:28:39 | NULL |
| 31838 | Mariana Carminatti Bicca | mariana_carminatti@hotmail.com | 55 54999040708 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-07-11 12:13:28 | NULL |
| 8407 | Miguel Alonso Livia Tanchiva | alonsolivia@outlook.com | 51932588323 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2024-10-17 18:05:56 | NULL |
| 22096 | Neliane Cora Vellozo | nelliane@yahoo.com.br | 55 11987535873 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-02-12 00:22:21 | NULL |
| 10795 | Nicolle San Nicolas Dubrull Lia Lucarelli | nidubrull@gmail.com | +55 16997273255 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-03-18 20:01:32 | NULL |
| 22606 | Paulino Mitsuo Kakuno | kakuno@ortodontia.com | 55 43999953600 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-04-08 23:13:09 | NULL |
| 6400 | Renan Veiga | renanveiga@hotmail.com.br | 55 43996279323 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-06-17 13:25:59 | NULL |
| 21978 | Rodrigo Rettore | rodrigorettore@hotmail.com | 55 11 983058429 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-05-14 01:55:33 | NULL |
| 23013 | Rosângela Pagliuso de Campos Celestino | ropagcamp62@gmail.com | 55 (13) 99111-1694 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-05-19 01:04:16 | NULL |
| 32299 | Sheila Marinho Araujo Pinheiro | sheilamarinho.nutri@gmail.com | 55 98984139897 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-08-11 02:04:11 | NULL |
| 15625 | Taynara donario Armendaris | taynaradarmendaris@gmail.com | 5548996428684 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-06-24 20:52:27 | NULL |
| 16661 | Thatiana Callile Marinho | thaticallile@gmail.com | 55 21996091444 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2024-03-09 13:33:50 | NULL |
| 21710 | Vinicius lima | vine.lima2504@gmail.com |  | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-05-17 16:40:58 | NULL |
| 1086 | Walter Medina | walterpenamedina@gmail.com | 51 988826104 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2025-10-12 20:55:15 | NULL |
| 22030 | WEDJA MONARA EVANGELISTA SILVA | wedjamonara@gmail.com | 5569993388514 | Dental GO Recorrente - R$ 89,00 | 8900 | months | active | 2026-04-15 01:34:55 | NULL |
| 577 | Carlos Baptista | baportho@yahoo.com.br |  | Dental Press DentalGO - R$78,00 | 7800 | months | active | 2021-01-08 13:46:06 | NULL |
| 6454 | Cristian Navarrete Contreras | ortonav@gmail.com | 5698836119 | Dental Press DentalGO - R$78,00 | 7800 | months | active | 2021-01-08 14:13:55 | NULL |
| 3437 | Roque Oliveira Almeida | bobpiritiba@hotmail.com | +55 74999611916 | Dental Press DentalGO - R$78,00 | 7800 | months | active | 2021-01-08 13:43:46 | NULL |
| 3720 | Jessica Bocato | jessica.bocato86@gmail.com |  | Dental Press DentalGO Primeiro Mês Grátis - R$ 78,... | 9800 | months | active | 2021-01-08 13:28:53 | NULL |
| 3354 | Antonio Marcos Massaharo Kushino | marcoskushino@hotmail.com | 595973565675 | Dental Press DentalGO Promocional - R$ 48,00 | 4800 | months | active | 2021-01-08 13:37:02 | NULL |
| 1822 | Carlos Salles | clfsalles@gmail.com | +55 44999733444 | Dental Press DentalGO Promocional - R$ 48,00 | 4800 | months | active | 2021-01-08 13:35:15 | NULL |
| 562 | Gabriel Khoury | khoury_gabriel@hotmail.com | +55 991242532 | Dental Press DentalGO Promocional - R$ 48,00 | 4800 | months | active | 2021-01-08 13:35:17 | NULL |
| 3939 | Giordana Ariane Ribeiro Schwerz Antunes de Melo | giordanaariane@hotmail.com | 5549985013393 | Dental Press DentalGO Promocional - R$ 48,00 | 4800 | months | active | 2021-01-08 13:38:03 | NULL |
| 6600 | Ricardo Armenio | ricardo.armenio@unoesc.edu.br | +55 49999764600 | Dental Press DentalGO Promocional - R$ 48,00 | 4800 | months | active | 2021-01-08 13:48:15 | NULL |
| 7229 | Sergio Cury | sergiocury@radiocentro.com.br | 55 24992514952 | Dental Press DentalGO Promocional - R$ 48,00 | 4800 | months | active | 2021-01-08 14:12:41 | NULL |
| 2880 | Carolina Groppa | cah.groppa@hotmail.com |  | Dental Press DentalGO Promocional - R$ 58,00 | 5800 | months | active | 2021-01-08 14:19:16 | NULL |
| 1044 | Caroline Giacomini | carol-cmgiacomini@hotmail.com | +55 46999052469 | Dental Press DentalGO Promocional - R$ 58,00 | 5800 | months | active | 2021-01-08 14:14:36 | NULL |
| 6312 | Rejane Dorchete | remussoi@hotmail.com |  | Dental Press DentalGO Promocional - R$ 58,00 | 5800 | months | active | 2021-01-08 14:14:26 | NULL |
| 3986 | Renata Santos | renatadfs@hotmail.com | +55 79991771319 | Dental Press DentalGO Promocional - R$ 58,00 | 5800 | months | active | 2021-01-08 14:02:53 | NULL |
| 7231 | Vitor Cordeiro | vito_orto@hotmail.com | 55 79991988178 | Dental Press DentalGO Promocional - R$ 58,00 | 5800 | months | active | 2021-01-08 14:13:57 | NULL |
| 5916 | Gilberto Marcos | gilbertohuapaya@yahoo.es | +51 999605717 | DentalGO | 7800 | months | active | 2021-01-08 13:29:49 | NULL |
| 2557 | Instituicao Matogrossense | douglas@univag.edu.br |  | DentalGO | 7800 | months | active | 2021-01-08 13:33:43 | NULL |
| 947 | Kamila Cristino | kamilagodoy@hotmail.com |  | DentalGO | 7800 | months | active | 2021-01-08 14:05:53 | NULL |
| 1979 | Marcos Fadanelli | fadanelliodonto@gmail.com | +55 (54) 981159462 | DentalGO | 7800 | months | active | 2021-01-08 13:34:56 | NULL |
| 6785 | SUZANA KIND LEAL DE S THIAGO | suzanas.thiago@gmail.com |  | DentalGO | 7800 | months | active | 2021-01-08 13:29:59 | NULL |
| 2710 | Henrique Neto Andrade Gonçalves | xingu89@gmail.com | +55 31994585858 | DentalGO 1 Mês Grátis (quarentena) / Assinantes co... | 7800 | months | active | 2021-01-08 14:04:05 | NULL |
| 944 | Janaina Verona | janainaverona03@gmail.com |  | DentalGO 1 Mês Grátis (quarentena) / Assinantes co... | 7800 | months | active | 2021-01-08 14:02:08 | NULL |
| 6531 | Paulina Diaz | mpaulinaalbardiaz@gmail.com |  | DentalGO 1 Mês Grátis Internacional (quarentena) /... | 7800 | months | active | 2021-01-08 14:06:02 | NULL |
| 3625 | Sandra Ferreira | dra.sandramarinaferreira@gmail.com | +351 919794987 | DentalGO 1 Mês Grátis Internacional (quarentena) /... | 7800 | months | active | 2021-01-08 14:06:03 | NULL |
| 4665 | Milene Angelo Cazzaro Menini | mimenini@hotmail.com | 5514997113616 | DentalGo Anual R$ 58,00 + Revista Impressa | 7800 | months | active | 2024-05-20 17:51:35 | NULL |
| 476 | ADENILSON JOSÉ LEANDRO | adenilsonjleandro@yahoo.com.br | 55 37999833955 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-07-15 12:43:23 | NULL |
| 3113 | Alan Regis de Novaes | alanr_odonto@yahoo.com | 5573991947347 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-04-22 20:36:19 | NULL |
| 10992 | ALEX BRITO CLOSS | alexcloss1@hotmail.com | 5196655270 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-04-06 21:00:32 | NULL |
| 9192 | Alexandre da Silva Malhon | malhon@bol.com.br | 55 45999649016 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-05-28 12:20:18 | NULL |
| 1772 | Alexandre Lira | alexaslcd@gmail.com | 5587988143507 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-12-15 12:34:20 | NULL |
| 5109 | Alexandre Magno dos Santos | almagnos@hotmail.com | 55 31987946860 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-12-09 12:59:36 | NULL |
| 6551 | Alexandre Purcino Nogueira | alexandrepurcino@uol.com.br | 5511973352218 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-04-24 15:03:12 | NULL |
| 3660 | Alexandre Ribeiro | alexandrestribeiro@hotmail.com | 5591984177727 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-02-23 18:06:12 | NULL |
| 2706 | Alexandre Zanesco | azanesco@gmail.com | 5511989291714 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-16 19:48:43 | NULL |
| 39176 | Ana Cândida Azevedo Alcântara | can.azevedo78@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-10 13:18:00 | NULL |
| 6056 | Ana Gamboa | anamarciagamboa@gmail.com | 21999612153 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-02-13 19:49:18 | NULL |
| 2029 | Ana Rosa Girardi | anarosagirardi@hotmail.com | 5544991050093 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-05-25 16:52:18 | NULL |
| 1362 | André César Trevisi | andre@trevisizanelato.com.br | 5511999900503 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-04-28 12:57:35 | NULL |
| 7037 | André Luis Martins | drandrem@terra.com.br | 67981155372 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-10-17 19:08:21 | NULL |
| 15180 | ANDRE ULBRICHT OTTAIANO | aottaiano@gmail.com | 5521981811024 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-07-09 19:59:10 | NULL |
| 10257 | APCD-INSTITUICAO DE ENSINO SUPERIOR E PESQUISA LTD... | supervisora.biblioteca@faoa.edu.br | 551122232454 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-02-10 19:45:39 | NULL |
| 1669 | Aretuza Luanny Costa | costa.are@gmail.com | 5591984558781 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-06-16 20:51:12 | NULL |
| 33622 | Ariana Soares Rodrigues | ariana@dentate.com.br | 5511981667575 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-02-11 17:07:16 | NULL |
| 2935 | Atila Junior | atilavaladares@gmail.com | 5531998363990 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-11-18 18:23:52 | NULL |
| 8358 | Bruna Macedo | bruubmacedo@gmail.com | 5546991150982 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-07-15 13:20:48 | NULL |
| 32306 | Caetano Petrella Junior | petrellajunior@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-08-11 13:13:21 | NULL |
| 8234 | Camila Garghetti Rubim | odontologiagarghetti@hotmail.com | 5544999833112 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-10-10 17:05:17 | NULL |
| 33130 | Camila necchi Martins | clinicadrsouzamartins@gmail.com | 5566996912520 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-02-04 13:34:54 | NULL |
| 39183 | Carina Cavalcanti | cavalcanti_cary@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-11 17:04:05 | NULL |
| 3204 | Carlos Alberto Estevanell Tavares | carlos.a.e.tavares@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-16 13:00:21 | NULL |
| 7157 | Carlos Alberto Landin Lahoz | clahoz@uol.com.br | 551938077429 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-08-14 18:09:18 | NULL |
| 39146 | Carolina de Oliveira Preste | carolinapreste@gmail.com | 5524999667104 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-05-29 16:37:53 | NULL |
| 10903 | Carolina Fontes Pukanski | capukanski@hotmail.com | 5542999262181 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-01-13 13:04:28 | NULL |
| 704 | CELSO ANTONIO HAAG | cahaag@terra.com.br | 55 4832433154 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-07-15 20:01:19 | NULL |
| 6227 | Cesar Poletto | cesarpoletto2@gmail.com | 5549999513093 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-22 13:27:12 | NULL |
| 844 | Cleice Luizi da Silva Silvério | cleice_luizi@hotmail.com | 55 849981747999 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-08-20 17:46:05 | NULL |
| 20403 | Clovis Yokoyama | clovisyokoyama1959@gmail.com | 5521999830438 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-07-22 16:43:17 | NULL |
| 16434 | Cristina Bastiani | crisbastiani@outlook.com.br |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-09 19:06:12 | NULL |
| 7549 | Daniel Alves Leão | daniel.leao.ortodontia@gmail.com | 64984480008 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-01-29 16:59:45 | NULL |
| 9448 | DANIELA SAUERESSIG ANVERSA | danisau@gmail.com | 5551999661998 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-10-20 13:27:24 | NULL |
| 7260 | Dario Fernandes Lopes Neto | dflneto@gmail.com | 5582993214686 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-02-19 20:23:56 | NULL |
| 1267 | Denis Cesar Emerick | denis.emerick@yahoo.com.br | 55 31984864446 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-08-21 20:34:18 | NULL |
| 20510 | Denise Figueredo | denise.figueredo@hotmail.com | 55 75999690318 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-10-02 17:18:56 | NULL |
| 32009 | Domingos Augusto Alonso | domingosrcc@bol.com.br |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-07-28 17:36:11 | NULL |
| 6141 | Eduardo Terumi Blatt Ohira | eduohira@gmail.com | 55 48999892879 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-08 17:04:41 | NULL |
| 7184 | EGON JOSE BINSFELD | egonbinsfeld@hotmail.com | 5555999633876 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-09 13:23:15 | NULL |
| 22121 | ELIS DIAS | elisschiaveto@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-02-14 20:40:29 | NULL |
| 20539 | Fábio Henrique Araújo Costa | drfhenrique@gmail.com | 5584999298200 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-01-30 20:15:45 | NULL |
| 9383 | fabio luis bueno | fabioluisbueno@hotmail.com | 55 14998843132 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-12-11 14:29:21 | NULL |
| 908 | Fabio Mendes | frmendes@yahoo.com | 5594981158306 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-04-01 13:20:46 | NULL |
| 10273 | Fabio Schemann Miguel | fade@terra.com.br | 5511981870341 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-01-22 20:26:37 | NULL |
| 860 | Fausto Silva Bramante | faubramante@hotmail.com | 5514991169777 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-17 20:24:20 | NULL |
| 4441 | Flavia Frade Paranhos | flaviaesergiojr@yahoo.com | 5521986642468 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-06-05 18:54:39 | NULL |
| 2133 | Flavia Reis de Oliveira Lutti | flavinhareis1@hotmail.com | 5516991857934 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-04-09 12:24:01 | NULL |
| 5754 | FLAVIO HENRIQUE COGNETTI | fhcognetti@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-11-11 20:17:02 | NULL |
| 16832 | FREDERICA HOELTZ | hoeltzodontologiaesaude@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-19 13:04:55 | NULL |
| 8223 | Gerson Luiz Ulema Ribeiro | gersonulema@gmail.com | 5547999845735 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-07-29 17:56:41 | NULL |
| 686 | Gidalti Linhares | gidaltibuenolinharesortodontia@gmail.com | 55 42991094131 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-11-28 20:52:51 | NULL |
| 3809 | Giovani Fidelis de Oliveira | gfidelis2@gmail.com | 55 61981892215 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-13 21:38:51 | NULL |
| 5542 | GISELLE NABACK LEMES VILANI | vilani.bhe@gmail.com | 5531993943030 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-02-24 14:06:27 | NULL |
| 2787 | Giselle Quinteiro | mgqsantos@yahoo.com.br | 5519991823673 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-05 13:46:48 | NULL |
| 19542 | Gustavo Alfonso de BRito | gustta.brito@gmail.com | 55 49988076247 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-02-18 13:30:13 | NULL |
| 18341 | Haydee Dias Vilela | haydeediasvilela@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-08-22 13:58:04 | NULL |
| 936 | Hernan | hernanramirez31@hotmail.com | 55964665266 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-03 13:14:00 | NULL |
| 6686 | Hildegardo Santana | santanahildegardo@gmail.com | 5585999821615 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-01-16 12:42:06 | NULL |
| 20610 | Isabela Beatriz | oliveiraisabelabeatriz@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-04 10:49:41 | NULL |
| 7581 | Isabela Bittencourt Basso | isabelabbasso@hotmail.com | 5541997088550 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-11-21 18:00:21 | NULL |
| 15010 | Izabela.carneiro@hotmail.com | Izabela.carneiro@hotmail.com | +55 71991402099 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-10-23 14:32:31 | NULL |
| 5036 | Jaislla Silva | j.aislla@hotmail.com | 5545991346255 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-03-10 11:37:24 | NULL |
| 10470 | Joao Carlos Zanata | jczanata@gmail.com | 5565999810462 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-07-16 16:31:25 | NULL |
| 8240 | JOSE BORGES DE MOURA JUNIOR | jborgesodonto@gmail.com | 5586999875680 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-04-23 11:37:57 | NULL |
| 2473 | josé faiçal junior | josefaical@sercomtel.com.br | 55 43999920173 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-12-09 20:03:11 | NULL |
| 7170 | Jose Menezes de Andrade Junior | brejauba07@hotmail.com | 5533988222805 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-10-17 13:01:38 | NULL |
| 32922 | Jose Renato | crisjrpadua@terra.com.br |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-08 18:53:04 | NULL |
| 15628 | JOSUE MARTOS | martosj67@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-04-29 12:45:26 | NULL |
| 8383 | Juliana Targino Dias de Sa Fonseca | julianatdsf@yahoo.com.br | 5527999485015 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-10-02 18:10:31 | NULL |
| 9107 | JULIANNY FERREIRA | julianny-ij@hotmail.com | 5588999253551 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-01-12 11:46:15 | NULL |
| 6041 | Karoenna Costa | karoenna@yahoo.com.br | 5586999961623 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-12-03 20:19:27 | NULL |
| 39181 | KELLI ROBERTA MURASAKI ANDRADE CARMONA | kelli_andrade@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-11 11:58:29 | NULL |
| 5711 | Kelly Cristina Oliveira de Morais | kellymorais2007@yahoo.com.br |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-07-24 14:17:23 | NULL |
| 19915 | Luanna Kairala Costa | luannakcosta@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-26 12:07:34 | NULL |
| 1962 | Lucas Estambassi Silva | lucasestambassi@gmail.com | 5532999252582 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-06-02 10:59:18 | NULL |
| 3600 | Luciana Carvalho  Goulart  Coelho | lugoulcoelho@hotmail.com | 5519992197176 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-04-24 15:01:35 | NULL |
| 20516 | Luciana Leão | lucianavleao@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-10-03 17:27:01 | NULL |
| 4740 | Luciano Adelino Giacon | lucianogiacon@icloud.com | 5549988010852 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-25 19:52:23 | NULL |
| 6194 | LUDMILA ARAGAO OLIVEIRA | luddmila_oliveira@hotmail.com | 55 99991997571 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-01-28 13:27:15 | NULL |
| 15174 | Luegya Knop | luegya@gmail.com | 5571986047302 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-05-04 13:17:54 | NULL |
| 6956 | LUIZ EDUARDO ALESSIO JUNIOR | lui.alessio@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-05-19 20:08:12 | NULL |
| 9280 | LUIZ FELIPE VIANA  MAFFIA | drluizfelipe@gmail.com | 5511959292376 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-02-13 13:37:27 | NULL |
| 2149 | Luiz Orbolato Rotta | luiz@rotta.odo.br | 5518997727700 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-10-15 12:45:09 | NULL |
| 790 | Maira de Almeida Brito | cdmaira@hotmail.com | 5533987255443 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-02 12:09:11 | NULL |
| 22081 | Manuela Pernambuco Gomes Tibúrcio | dramanuelapernambuco@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-02-07 20:51:21 | NULL |
| 7387 | Marcelo Codeceira Lopes Araujo | orto.codeceira@gmail.com | 5521999559292 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-01-22 20:30:03 | NULL |
| 7576 | Marcelo de Carvalho | cd.mc@hotmail.com | 32999109014 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-04-17 18:41:31 | NULL |
| 8268 | Marcelo Pires Prestes | br.pires@uol.com.br | 55 14996712020 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-11 12:06:07 | NULL |
| 874 | Marcelo Suzuki | drmarcelo@clinicacoss.com.br | 5511972483881 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-12-10 13:25:12 | NULL |
| 19716 | MARCO ANTONIO SATO | marcoasato@uol.com.br |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-22 15:08:51 | NULL |
| 6938 | Marcos Aurelio Pascoal de Lima Filho | marcoslimaodontologia.cursos@gmail.com | 55 85996900004 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-05-08 14:12:13 | NULL |
| 34389 | Marcos Pascoal | marcosapascoal@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-01-29 17:01:09 | NULL |
| 4838 | Marcos Shinao Yamazaki | marcos.yamazaki@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-12 12:18:58 | NULL |
| 3180 | Marcus Vinicius Neiva Nunes do Rego | marcus_rego@yahoo.com.br | 5586994822248 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-05-25 19:11:39 | NULL |
| 39157 | Margarete Pilar | margarete.bannuart@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-05-29 20:12:46 | NULL |
| 2151 | Maria Cristina Jesus | mariacristinafj@uol.com.br |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-13 19:04:59 | NULL |
| 7398 | Maria Fernanda Martins e Ortiz Posso | mfmartinsortiz@gmail.com | 67981832737 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-02-24 16:13:23 | NULL |
| 3910 | Marilene Cunha Lorenzetti | malorenzett@gmail.com | 5511974891306 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-11-25 20:33:10 | NULL |
| 16489 | Marília Spínola Azevêdo Sampaio | spinolamarilia@hotmail.com | 5571999153900 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-11-12 19:27:41 | NULL |
| 8763 | Marina Alcântara Ferracini | maalcantara@icloud.com | 5543999793805 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-02-24 13:36:36 | NULL |
| 15562 | Marina Coan | marinamcoan@hotmail.com | 55 48999599592 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-08-28 12:55:53 | NULL |
| 2894 | Marvio Martins Dias | ortomarvio11@gmail.com | 5598983060863 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-23 21:01:14 | NULL |
| 10994 | MERCIA W | merciawu1@gmail.com | 351998556559 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-23 17:02:16 | NULL |
| 19591 | Messias Rodrigues | dr.messiasrodrigues@hotmail.com | 5519981332222 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-02-28 12:57:08 | NULL |
| 2316 | Michele Suppion | michele.ortodontia@gmail.com | 5511930048001 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-31 12:14:33 | NULL |
| 3634 | Michelle Alonso Cassis Benjamin | michellecassis@yahoo.com.br | 5514996512112 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-02-10 19:39:07 | NULL |
| 1470 | Murilo Augusto Anacleto | muriloanacleto@uol.com.br | 55 31999884360 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-23 20:17:34 | NULL |
| 22133 | Natalia Lombardo | dranatlombardo@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-02-18 20:23:37 | NULL |
| 19741 | Nathalia Andrade | nathalia.las@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-03 18:31:05 | NULL |
| 19769 | Nayara Alves Brandão | nayaraalves83@gmail.com | 55 71991507601 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-08-21 20:33:43 | NULL |
| 38695 | Nelly Sanseverino | nelly@sanseverino.com.br | 5511984688000 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-16 17:40:35 | NULL |
| 5333 | Neyza Malvina | nenaneyza1@hotmail.com | 5593991811409 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-03-05 14:30:35 | NULL |
| 7215 | Nilma Henze Pimentel | nilmahenze@hotmail.com | 5521969287374 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-05-21 14:39:28 | NULL |
| 495 | Oswaldo Jose Alves Pinto Junior | oswaldojap.oja@gmail.com | 5511997155728 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-23 20:16:43 | NULL |
| 19677 | Paloma Santos de Campos | pala_santos@hotmail.com | 5551997081278 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-12 16:50:56 | NULL |
| 6695 | Patricia Cristina Ereno | botelholeao@gmail.com | 55 91981112254 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-12-18 13:56:33 | NULL |
| 8341 | Paula Cristina da Cunha Silveira | paulasilveir@yahoo.com.br | 5551992433714 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-02-07 17:08:11 | NULL |
| 22749 | Paulo Henrique Bastos | phbastos3103@gmail.com | 5541996199977 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-12-11 14:15:12 | NULL |
| 1577 | Paulo Pinheiro | paulomarcioitpac@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-05-08 13:47:34 | NULL |
| 3436 | Pedro Luis Scattaregi | scatta@uol.com.br | 5511973872296 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-02 12:11:52 | NULL |
| 7222 | Peterson Pastorelli | petersonpastorelli@hotmail.com | 55 17997047644 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-04-22 20:36:42 | NULL |
| 9053 | RAQUEL CRISTINA SANTANA PRAXEDES | quelpraxedes@hotmail.com | 5585982012101 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-02-12 14:26:37 | NULL |
| 20642 | Regiane Konjunski Correa | regianekonjunskicorrea@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-10-16 20:54:21 | NULL |
| 21358 | Renata Furtado Camilo Carnielli | renataf.camilo@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-11-27 11:35:31 | NULL |
| 20651 | Renata Yuri Kikugawa | renata.kikugawa@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-29 18:00:31 | NULL |
| 7391 | Renato Araujo Ribeiro | renatoribeiro.orto@gmail.com | 5571988237110 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-04-10 13:19:12 | NULL |
| 21492 | Roseli Lessa | roseli.nunes.melo@gmail.com | 5511995301092 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-10-23 14:29:11 | NULL |
| 39180 | Sandra Yukie Mizoguchi Lo Giudice | sandramizoguchi@yahoo.com.br |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-06-10 20:29:58 | NULL |
| 2910 | SAULO ANDRÉ DE ANDRADE LIMA | sauloaal@hotmail.com | 5598981589396 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-23 17:43:21 | NULL |
| 6240 | Shirley Marcia Rossetto | contato@rossettoodontologia.com.br | +55 1130795561 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-03-31 17:10:57 | NULL |
| 945 | SIDNEI MAURILIO PRANDO | smp.prando@gmail.com | 5511991376545 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-01-22 11:35:18 | NULL |
| 20525 | Silvia Helena Faria | Sh_ziober@hotmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-10-04 14:41:55 | NULL |
| 3658 | Silvia Reis | silviabreis@hotmail.com | 5531996941357 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-08 19:40:42 | NULL |
| 7734 | Simone Caetano da Silva Queiroz | simone-caetano@outlook.com | 5534999642442 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-10-28 17:55:27 | NULL |
| 1288 | Solange Nunes da Costa | solangenc@uol.com.br | 5511998937461 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-12-16 12:04:55 | NULL |
| 14585 | SUELLEN RAFAELA VIEIRA | suhrafaela@gmail.com | 55 44998580465 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-08-05 11:29:59 | NULL |
| 23142 | Tarcisio Pereira | ortodontiatarcisiojunqueira@gmail.com |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-05-22 13:30:43 | NULL |
| 10738 | Tayla Granemann | taylagranemann@hotmail.com | 5541996805931 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-09-19 13:21:12 | NULL |
| 5718 | Teste | teste@teste.com.br |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-06 19:44:05 | NULL |
| 1433 | Thais Gimenes | thaisbarthgimenes@hotmail.com | 5543984185888 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-08-12 17:30:10 | NULL |
| 5530 | tony vieira faria | tonyvf21@hotmail.com | 55 (27) 98182-8677 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-05-06 15:08:21 | NULL |
| 6052 | Viviane Andrade | viviane.amaral10@gmail.com | 5561984155222 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2024-10-02 19:44:27 | NULL |
| 20666 | WASHINGTON DA CRUZ | wcruz4@yahoo.com.br |  | DentalGo Anual R$ 68,00 | 6800 | months | active | 2025-08-22 19:42:42 | NULL |
| 1031 | Wilson Guilherme Nunes Rosa | wilsorosa@gmail.com | 5548991280009 | DentalGo Anual R$ 68,00 | 6800 | months | active | 2026-03-03 17:24:03 | NULL |
| 20512 | Daizy Guedes de Carvalho Stikan | daizyguedes@hotmail.com | 5527999547358 | DentalGo Anual R$ 68,00 + Revista Impress | 8800 | months | active | 2026-02-11 14:16:43 | NULL |
| 8307 | Jose Cardoso Oliveira | cardosoorto@hotmail.com | 5532988767129 | DentalGo Anual R$ 68,00 + Revista Impress | 8800 | months | active | 2025-07-23 20:31:11 | NULL |
| 5887 | ADALBERTO DE PAULA SOUZA JUNIOR | adbjr@terra.com.br | +55 11984370609 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-12-04 17:16:38 | NULL |
| 4106 | Adriano Rodrigues | adrianorodrigues.orto@hotmail.com | 5531984276206 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-02-02 11:24:51 | NULL |
| 2876 | ALADIM LUCIANO JUNIOR | aladimjunior@hotmail.com | 5541996447313 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-03 13:20:30 | NULL |
| 14936 | ALESSANDRO FREITAS DE OLIVEIRA | alessandro.oliveira1@hotmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2025-05-22 13:28:16 | NULL |
| 7275 | Alexandre Monteiro da Silva | alexandre.m.silva@uol.com.br | 5586994217908 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-08-20 19:03:51 | NULL |
| 7164 | Alexandre Simplício | alexcoeli@uol.com.br | 55 86999860950 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-11-19 13:22:54 | NULL |
| 824 | Alexandre Valtuille Ribeiro | alexavr@terra.com.br | 5562999788623 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-05-09 18:36:50 | NULL |
| 8232 | ANA CLAUDIA DANTAS MENDES | anaclaudiaorto@hotmail.com | 5583993713005 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-10-09 20:19:48 | NULL |
| 14488 | Ana Júlia Deschamps Jahn | ana_julia_jahn@hotmail.com | 5547991812210 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-08 17:16:52 | NULL |
| 5573 | Ana Lurdes Conte Acunha Gonçalves | conteanalurdes@gmail.com | 5554999671632 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-02-11 20:03:58 | NULL |
| 2547 | Ana Resende | carolresende30@yahoo.com.br |  | DentalGo Anual R$58,00 | 5800 | months | active | 2025-04-04 13:56:30 | NULL |
| 5519 | Anderson Capistrano | capis.500@gmail.com | 55 81999626005 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-13 20:41:43 | NULL |
| 401 | Andre Schinestsck | andre@dimax.com.br | 5553984035362 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-07-31 17:23:07 | NULL |
| 9470 | André Zanelato | andre@trevisi.com.br | 551199900503 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-16 14:10:50 | NULL |
| 9439 | Andressa da Costa Manholer Silva | andressamanholers@gmail.com | 5544999342475 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-24 19:11:53 | NULL |
| 8534 | APARECIDA CONCEICAO BERTO DE MELLO DOS SANTOS | aparecidamello.cd@gmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-08 14:45:57 | NULL |
| 14650 | ARY LOCCI JUNIOR126 | aryloccijr@uol.com.br | 55 17996048547 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-20 13:22:01 | NULL |
| 6233 | Associação Brasileira de Odontologia | mrsancho560@gmail.com | 55 71 991690686 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-02 16:55:22 | NULL |
| 794 | Aubrey Fabre | aubrey_fabre@hotmail.com | 5518997877979 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-05-30 16:33:01 | NULL |
| 6083 | Basilio Junior | bernaljunior@gmail.com | 5511999308490 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-08-12 13:11:03 | NULL |
| 7169 | Bolivar Junior | bolivarpimenta@yahoo.com.br | 55 14991338249 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-04-16 12:28:54 | NULL |
| 9618 | Breno Minervini Sabbo | brenominervini@hotmail.com | 55 32988310823 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-10-03 21:00:48 | NULL |
| 1847 | Camila Cinto Arita | camilaarita@me.com | 55 16997257282 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-08-20 13:04:12 | NULL |
| 2320 | Camila Ferreira Casagrande Carletti | camilafcasagrande@hotmail.com | 5527981648734 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-10-09 12:29:40 | NULL |
| 9611 | Camila Galvão Cardoso | camilagalvao89@yahoo.com.br | 5511979766423 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-16 13:51:36 | NULL |
| 4057 | Camilo Massa Ferreira Lima | camilomassa10@gmail.com | 55 81988636757 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-04-01 13:56:56 | NULL |
| 5909 | Carla Redondo | carlaapredondo@hotmail.com | 5567999628969 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-07-04 12:31:54 | NULL |
| 5973 | Carlos Almeida | carlosalmeida76@hotmail.com | +32 468182608 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-11-19 20:39:40 | NULL |
| 854 | Carlos Henrique Monteiro Carvalho | casehcarvalho@hotmail.com | 5531992618000 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-04 12:58:10 | NULL |
| 2887 | Carlos Xavier | carlosandrexav@yahoo.com.br | 5538999421207 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-03-20 13:30:15 | NULL |
| 5431 | Carolina Souto Lima | limascarolina@gmail.com | 559192933838 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-11-21 19:48:55 | NULL |
| 9748 | Centro Avançado Ortodontia | biblioteca@facpp.edu.br | 5585982053222 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-08-26 19:43:24 | NULL |
| 9218 | Centro Médico Dentário Dr Sousa Pinto | cmdsousapinto@gmail.com | 351966581691 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-11-19 14:47:00 | NULL |
| 9265 | Charles Zorzetto | chzorzetto@gmail.com | 550000000000 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-04-24 14:30:59 | NULL |
| 8540 | Chirley Roberta Hermes | chirleyhermes@hotmail.com | 5551997245753 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-01 20:18:08 | NULL |
| 20414 | Claudio Sesso | clasesso@hotmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-16 14:56:26 | NULL |
| 6503 | Daniel G. Fangueiro | danifangueiro@hotmail.com | 5541988287040 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-08-05 17:29:52 | NULL |
| 2257 | Daniel Rodrigo Salles | dnsalles@hotmail.com | 553537216731 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-03-12 14:32:31 | NULL |
| 1766 | Daniela Camargo | dani.batalha@uol.com.br | 5511999079628 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-19 18:25:27 | NULL |
| 20482 | Daniela Daufenback Pompeo | danidaufenback@gmail.com | 5548988273424 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-26 19:32:50 | NULL |
| 9247 | DANIELA KIMAID SCHROEDER | danikimsc@gmail.com | 552122677286 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-08 14:40:53 | NULL |
| 33688 | Daniela Ody | daniody@uol.com.br | 5551999943423 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-11-13 20:04:46 | NULL |
| 4765 | Daniele Scotti | scottiodonto@hotmail.com | 5546991063231 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-17 14:34:56 | NULL |
| 8325 | Danielle Bazzo | dradaniellebazzo@gmail.com | 5542991041700 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-10-21 19:08:11 | NULL |
| 5438 | Dario Macri | dario@ortopos.com.br | 5517991529565 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-08-29 19:08:56 | NULL |
| 6013 | Darwin Vaz de Lima | darwinvl@terra.com.br | 5565999720806 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-06-20 14:07:52 | NULL |
| 5740 | Debora Ribeiro | debyorto@hotmail.com | 5511973909188 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-25 12:54:46 | NULL |
| 6725 | Denise Caffer | decaffer@hotmail.com | 5565999726761 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-02-19 13:17:28 | NULL |
| 6524 | Denise Silveira Mezencio Borges | denisemezencio@yahoo.com.br | 5531988154497 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-26 16:35:38 | NULL |
| 34339 | Diana Castro | dianalcastro@hotmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2026-01-09 11:43:36 | NULL |
| 5541 | Diana Pizzurno | dianita.982@hotmail.com | 5955959719894 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-11-10 19:46:39 | NULL |
| 5752 | DIEGO LUIZ TONELLO | dltonello@yahoo.com.br | 5554999058935 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-07-10 17:56:49 | NULL |
| 6254 | Eduardo Mangolin | edumangolin@hotmail.com | 5513991048000 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-24 19:48:57 | NULL |
| 9613 | Elaine Aparecida Portugal | eportugal30@gmail.com | 55 11983354479 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-08-26 20:37:27 | NULL |
| 3040 | Elizangela Santos | elizangela-bsantos@hotmail.com | 55 27999284220 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-02 12:36:50 | NULL |
| 7043 | Ernesto Rodrigues | ernestorodrigues@yahoo.com.br | 5532988798648 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-12 20:06:40 | NULL |
| 3041 | Evandro Ciuca Tanzilli dos Santos | evandrociucatanzillidossantos@gmail.com | 5535999740798 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-04 19:20:50 | NULL |
| 6764 | Evellyn Domingos | evellynfd.oliveira@gmail.com | 5516997834154 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-03-10 18:09:53 | NULL |
| 9057 | FABIANE LOULY BAPTISTA SANTOS SILVA | fablouly@hotmail.com | 5565981115853 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-02 19:30:48 | NULL |
| 4713 | Fabiane Mainardes | fabianemainardes@hotmail.com | 5542998438080 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-08-21 11:30:03 | NULL |
| 633 | Fábio Donato | dr.reberti@gmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2025-07-21 16:19:08 | NULL |
| 15239 | Fausto Côrtes Isaac | faustoisaac@hotmail.com | 55 62996164929 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-02-18 18:22:06 | NULL |
| 5994 | Fernanda Cristina de Araujo Ribas | fer_araujo4@hotmail.com | 5541991030872 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-02-09 14:59:06 | NULL |
| 3293 | Fernanda Raffaelly de Oliveira Pedreira | nandarafaelly@hotmail.com | 5535988117737 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-02-19 18:53:26 | NULL |
| 15029 | FERNANDO DELMAN | fernandodelman@gmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-10 19:23:58 | NULL |
| 7191 | Fernando Machado | fmacorto@yahoo.com.br | 55 35988513341 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-15 12:34:52 | NULL |
| 33614 | Flavia Araujo | dantasflavia@hotmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-31 20:15:49 | NULL |
| 1659 | Flavio Simoes | flavio.simoes@terra.com.br | 5565999819688 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-07-11 20:31:26 | NULL |
| 5675 | Francielen Prates Ferreira Barbosa | francielenpfb@gmail.com | 5531991876076 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-08 14:24:13 | NULL |
| 10007 | Gabriela Shlemper Largura | gabischlemper@hotmail.com | 5547988267106 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-15 18:45:06 | NULL |
| 7268 | George Otto Florencio Pereira | georgeotto@hotmail.com | 5592981493833 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-16 17:18:18 | NULL |
| 9617 | Geraldo Gil Faggioni Junior | marinas.faggioni@gmail.com | 5534999186848 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-04-06 18:43:09 | NULL |
| 8375 | Gisele Patricia de Souza Albuquerque Machado | albuquerquemachadopericias@gmail.com | 5521996347770 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-11-03 17:24:17 | NULL |
| 15163 | GUILHERME MARIIGO | gmarigo@hotmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-04 16:34:53 | NULL |
| 9250 | GUSTAVO ANTÔNIO MARTINS BRANDÃO | gbortodontia@gmail.com | 5591982061111 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-06-09 20:24:34 | NULL |
| 5699 | Hallissa Pereira | hallissa@hotmail.com | 5584999747888 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-16 14:53:14 | NULL |
| 1448 | HIBERNON LOPES LIMA FILHO | hibernonlopes@hotmail.com | 558234321141 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-29 16:46:00 | NULL |
| 4139 | Ivan Giannini | dr.ivan.giannini@gmail.com | 55 11999283549 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-15 18:38:30 | NULL |
| 525 | Ivan Vaz de Campos Junior | ivazjunior@hotmail.com | 5522988018747 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-07-15 12:39:12 | NULL |
| 3725 | Izabel Cristina de Mendonça Campos Freitas Falcão | izabelfalcao@hotmail.com | 5581999794968 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-18 14:57:46 | NULL |
| 7519 | Jaime Sampaio Bicalho | jaime.bicalho@gmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2025-01-29 18:10:59 | NULL |
| 2348 | Jairo Benetti | ortojjbenetti@gmail.com | 5554981412874 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-11-28 18:55:48 | NULL |
| 14862 | Janete Mostaro | janetemostaro@hotmail.com | 5524981460800 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-03 16:33:26 | NULL |
| 1287 | Jaqueline Gadben | jaquelineortoestetica@gmail.com | 5535988560197 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-03-19 19:37:46 | NULL |
| 7283 | João Afranio Ramos | joaoafraniofonteles@gmail.com | 5588999215710 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-03-03 20:46:44 | NULL |
| 994 | joão m. baptista | profbaptista@icloud.com | 55 41992659966 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-12-16 20:42:18 | NULL |
| 1452 | João Manoel Pezzini | jpezzini@terra.com.br | 5545999299986 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-03-11 10:59:08 | NULL |
| 4819 | Joao Neto | joaogfn@hotmail.com | 5562981610369 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-01-21 20:49:07 | NULL |
| 4700 | Jose Eugênio Teixeira Rocha | eugenio.1.rocha@gmail.com | 558899353502 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-01 18:37:19 | NULL |
| 9304 | Jose Luciano Pimenta Couto | lucianopimenta@ufc.br | 5585988890939 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-11-17 19:34:52 | NULL |
| 7103 | JOSÉ VALLADARES NETO | jvalladares@uol.com.br | 5562982316000 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-04-15 13:31:45 | NULL |
| 858 | Julian Antonio Ayala Arellano | jaaarelhano@hotmail.com | 595 +595 981152616 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-01-15 20:11:28 | NULL |
| 6747 | Karine Nunes Ventura | karinenunesv@yahoo.com.br | 5531992319019 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-03-19 18:57:43 | NULL |
| 769 | Karine Ventura | karinenunes@yahoo.com.br | 5531992319019 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-12-02 20:39:27 | NULL |
| 20511 | Karla Isabella Menezes de Jesus | karlaisabella13@hotmail.com | 5579998153490 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-10-04 13:58:45 | NULL |
| 8589 | Karla Magnolia Napoli Brandão | karlanapoli@yahoo.com.br |  | DentalGo Anual R$58,00 | 5800 | months | active | 2025-07-17 12:56:58 | NULL |
| 10074 | Karyn Ribeiro de Rezende | karynodonto@hotmail.com | 5574999346242 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-05-23 18:22:37 | NULL |
| 6457 | Keila Maria  de Sousa Castelo | keilacastelo@hotmail.com | 5585986310530 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-30 20:27:23 | NULL |
| 3265 | Kélei Crisitina de Mathias Almeida | keleimathias.almeida@gmail.com | 5516997140314 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-10 14:48:21 | NULL |
| 7023 | Larissa Ferreira | larissa.alvimf@gmail.com | 5532991940707 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-10 17:39:47 | NULL |
| 15815 | Larissa Santos Lemos Alves | larilemos@hotmail.com | 5571999595902 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-04 18:03:36 | NULL |
| 8236 | Leonardo Bayerl Dessaune | leodessaune@gmail.com | 5527999988049 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-02-20 12:08:07 | NULL |
| 8041 | Leonardo Melo Mota | leomota2@hotmail.com | 5522992773466 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-02-14 20:10:01 | NULL |
| 9612 | Leticia Fabiana Pereira Soares | leticia.odonto85@gmail.com | 5562982124125 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-05 16:42:44 | NULL |
| 8745 | LÍLIAM GRAZIELLE DE MELLO AMARAL | liliamgrazielleamaral@hotmail.com | 5537999862123 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-12 12:32:41 | NULL |
| 5211 | Lis Monteiro de Carvalho Guerra | lismcarvalho@yahoo.com.br | 55 85991086000 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-05-20 12:05:10 | NULL |
| 8181 | Lizandra Adelaide Mathias de Alcantara | lizandraalcantara@yahoo.com.br | 5513991065113 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-05-08 20:40:14 | NULL |
| 3315 | Lucia Hatsue Yamamoto | lhyamamoto@gmail.com | 5511985983788 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-12-17 10:54:47 | NULL |
| 7972 | Lucianny Tavares Lucena | luciannylucena@hotmail.com | 5599982155754 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-06-13 18:03:47 | NULL |
| 6142 | Lucimara de Queiroz | lucimara.queiroz@yahoo.com.br | 5516981816604 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-19 14:24:10 | NULL |
| 19440 | Luis Fernando Macedo Melo | lfernandomacedom@hotmail.com | 5585999299791 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-27 11:00:15 | NULL |
| 9328 | Luiz Alberto Marchesan Fernandes | lmarchesan@terra.com.br | 5555999195091 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-06-20 19:04:43 | NULL |
| 5090 | LUIZ EDUARDO SCHROEDER DE LIMA | ortolima@gmail.com | 555533034054 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-07-11 16:47:37 | NULL |
| 7004 | LUIZ FELIPE VIEGAS JOSGRILBERT | luizorto@terra.com.br | 5567981649993 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-10 18:27:30 | NULL |
| 7109 | Luiz Furlan | furlanluiz1965@gmail.com | 5546999760269 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-12 17:54:32 | NULL |
| 5261 | Luiz Maciel | luuizmaciel@hotmail.com | 55 12992429390 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-08-12 11:58:44 | NULL |
| 4496 | Luiz Squillace | lhsquillace@gmail.com | 5565996706013 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-08-01 18:53:19 | NULL |
| 4742 | Maira Rocha | mairakrocha@gmail.com | 5551998141668 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-07-16 10:59:04 | NULL |
| 9861 | Manuela Colbeck Gonçalves | manuelacolbeck@gmail.com | 5521981575229 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-02 14:48:15 | NULL |
| 3342 | Mara Cinthia Pereira dos Santos | mcinthia@uol.com.br | 11996010544 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-03-02 20:50:03 | NULL |
| 1152 | Marcel Farret | marcelfarret@yahoo.com.br | 55999955586 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-16 12:15:25 | NULL |
| 20533 | Marcel Pedra Nunes | nunesmp@hotmail.com | 55 75988778196 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-02-04 11:33:50 | NULL |
| 4811 | Marcella Silva | marcellaferreiras@outlook.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-19 17:15:44 | NULL |
| 5881 | Marcelo Missel | marcelo.missel@hotmail.com | 5551993645070 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-15 18:04:13 | NULL |
| 6285 | Marcelo Venturinelli | marcelovm7@gmail.com | 55 22 999821622 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-13 14:53:00 | NULL |
| 6892 | Marcelo Xavier de Oliveira | maxorto@yahoo.com.br | +55 33 3271-2866 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-11-13 14:51:25 | NULL |
| 7527 | Marcia Elisa Candido Correa | marciaeccorrea@gmail.com | 54999855106 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-25 19:44:52 | NULL |
| 1429 | Marcia Suselei | susisalgueiro@gmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2025-08-05 11:10:25 | NULL |
| 10558 | Marcos Vanetti Prado da Albuquerque | albuquerque.ortodontia@gmail.com | 5527988196502 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-14 13:47:35 | NULL |
| 5418 | Margareth Baruhm Diegues | maggiebdiegues@gmail.com | 5511994510833 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-03 20:14:50 | NULL |
| 8098 | Maria Eduarda Alves Sampaio | meduardaasampaio@gmail.com | 5583996458497 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-11 11:26:55 | NULL |
| 3952 | Maria Okada | ckyokada@uol.com.br | 5511050124732 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-03-04 20:35:34 | NULL |
| 10013 | Mariá Pereira Vieira | maripereira.odonto@gmail.com | 5567998351515 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-08-08 17:24:15 | NULL |
| 1656 | Mariana Matsunaga Medeiros | mah_medeiros@hotmail.com | 5544999128664 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-04-11 17:16:07 | NULL |
| 3377 | Marinna Melo | clinicaneoodonto@gmail.com | 558432110777 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-07-14 16:48:47 | NULL |
| 5534 | Mário Eduardo Scavone | marioscavone@gmail.com | 5493512571174 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-11-10 20:13:01 | NULL |
| 445 | Maura Regia Lima Verde Moura Lopes | mauraregialopes@gmail.com | 5586998000668 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-05-04 15:01:32 | NULL |
| 8095 | Mauricio Brunetto | m-brunetto@hotmail.com | 55 41999118885 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-11-25 19:46:50 | NULL |
| 8247 | Maurilio Antonio Martins de Sousa | mauriliomartins50@gmail.com | 5531998049292 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-15 18:36:01 | NULL |
| 1081 | Mauro Emanuel Costa de Melo | ortodontiamauromelo@gmail.com | 5584999588200 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-03-09 20:43:59 | NULL |
| 424 | Micheline Siufi | michesiufi@hotmail.com | 5541999112915 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-28 13:54:58 | NULL |
| 2223 | Mila Zuffo Lang | milazuffo@yahoo.com.br | 5549991369246 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-03-27 17:11:45 | NULL |
| 8015 | Milena Moraes de Oliveira Lenza | milenalenza@yahoo.com.br | 5562999348766 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-10-02 10:47:57 | NULL |
| 4623 | Moema Barreto | moemaorto@gmail.com | 55 84 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-03-26 11:46:21 | NULL |
| 7463 | Nara Cristina Alves Camarana | naracamaranaorto@gmail.com | 5511998020202 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-05 14:43:32 | NULL |
| 2253 | Natalia Garcia Rafagnin | nati.odonto@gmail.com | 5541992024455 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-16 18:33:15 | NULL |
| 4086 | Natalia Trevizam | nataliatrevizam@gmail.com | 5567991616784 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-08-11 20:15:08 | NULL |
| 5903 | Niomar Miyagi | niomar@uol.com.br | 55 11998637018 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-03-11 19:21:06 | NULL |
| 3372 | Paloma Silva | palomabs@yahoo.com.br | 5591988531107 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-01-16 12:41:21 | NULL |
| 9659 | Patricia Porto Loddi | patricialoddi@hotmail.com | 5511983892233 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-06 16:48:15 | NULL |
| 775 | Paul Bernal | paulbernal@hotmail.com | 5594993004714 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-09 19:53:02 | NULL |
| 1204 | Paulo Pagano | pagpaulo@hotmail.com | 5542999721299 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-05-28 20:12:07 | NULL |
| 4610 | Priscila Andrade Gois | priscilaagois@hotmail.com | 5561984405791 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-01-13 20:51:13 | NULL |
| 4348 | PRISCILA DA SILVA DOS REIS | dra.priscilareis@hotmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-17 20:30:21 | NULL |
| 4099 | Rafael Peres | rafaelkmh@msn.com | 5541998086643 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-24 19:39:14 | NULL |
| 9669 | Rafaela Baratieri Padilha dos Santos | r_baratieri@hotmail.com | 5541996213852 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-07-10 19:35:58 | NULL |
| 8913 | RAFAELA CARFANE ZOCAL | rafaelacarfane16@hotmail.com | 5566999045421 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-04 14:36:37 | NULL |
| 9929 | RAQUEL RODRIGUES CARVALHO SILVA | raquelcarvalhos@hotmail.com | 5571991368738 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-31 20:21:28 | NULL |
| 4711 | Raul Antonio Gil Pistorello | raulpistorello@gmail.com | 5547999825304 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-11-07 20:11:57 | NULL |
| 3922 | Reinaldo Meira Leite | reinaldomleite1@gmail.com | 5577999794090 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-04 19:21:45 | NULL |
| 1600 | Renata Viana | renatasaviana15@gmail.com | +55 22 99978-3933 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-05 16:40:00 | NULL |
| 2207 | Rita Thurler | rit_abt@hotmail.com | 5511993335856 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-12-16 20:26:20 | NULL |
| 6641 | Roberto Carvalho | simonettirsc@gmail.com | 551182410411 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-04-24 18:05:00 | NULL |
| 3367 | Rodolfo Rocha | ortodontiauberlandia@gmail.com | 5534999081000 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-04-10 16:36:14 | NULL |
| 5237 | Rodrigo Lara de Oliveira | dr.rodrigolara@me.com | 5562999803162 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-02-26 19:23:50 | NULL |
| 2513 | Rodrigo Nunes Juvencio | naeorod@hotmail.com | 5548999269170 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-12-09 16:32:51 | NULL |
| 684 | Rodrigo Xavier Silveira de Souza | rodrigoxssorto@gmail.com | 5531991828232 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-12-05 12:52:30 | NULL |
| 2589 | Rosana Chagas | ortocleanestetica@hotmail.com |  | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-25 20:13:38 | NULL |
| 8474 | Rosana Penachio Cury | rosana_cury@hotmail.com | 5567991558989 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-01-31 13:50:21 | NULL |
| 2523 | Rossi Ltda. | sylviogoncalves@uol.com.br | 5511999539050 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-25 18:55:26 | NULL |
| 4206 | Samir Mohamad Ali Geha | samirmaglegal@yahoo.com.br | 554391175454 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-15 18:41:43 | NULL |
| 6062 | Scheyla Antunes | antunesscheyla@hotmail.com | 5521972146638 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-12-11 12:47:19 | NULL |
| 9969 | Sergio Luiz Mota Júnior | sergiomotajr_orto@yahoo.com.br | 55 32999511399 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-10-03 17:20:32 | NULL |
| 4065 | Sergio Penido | spenido61@gmail.com | 553799822927 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-09-17 20:02:58 | NULL |
| 9624 | SILVIA RODRIGUES DO NASCIMENTO | silvianascimento1408@gmail.com | 5511996131960 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-04-27 22:31:15 | NULL |
| 618 | Simone Fonseca Freitas Rodrigues da Silva | simoneffrsilva@terra.com.br | 55 11999830019 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-05-27 11:29:59 | NULL |
| 6722 | Sonia Rodrigues Dutra | soniardutra@yahoo.com.br | 5531996159454 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-11-07 20:11:15 | NULL |
| 3128 | Sonia Toso | tososr52@gmail.com | 5521992572116 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-10-09 20:03:02 | NULL |
| 9609 | Taissa Targino Cruz | taissatarginoc@gmail.com | 5583991450033 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-27 13:33:28 | NULL |
| 5487 | Tales dos Reis Llantada | talesllantada@hotmail.com | 5548999854757 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-11-10 20:20:57 | NULL |
| 9348 | THALITA LUANA BOZZANO CORREA | thalibozzano@gmail.com | 5541999503005 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-23 17:33:17 | NULL |
| 3622 | THIAGO LIMA MONTE | thiagolimamonte@gmail.com | 5586981159959 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-08-27 12:57:37 | NULL |
| 3299 | Ulisses Coelho | ulisses-coelho@uol.com.br | 5542999787453 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-01-09 14:17:18 | NULL |
| 33753 | Valéria de Oliveira Barbosa | valeria_barbosa8@hotmail.com | 5592981633657 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-11-25 17:23:30 | NULL |
| 9872 | Vânia Cravo Nabuco de Freitas | vaniacnf@gmail.com | 5521999190160 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-08-08 14:56:52 | NULL |
| 7367 | Vera Aparecida Parelli | verapare@yahoo.com.br | 11992728649 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-09-25 20:51:45 | NULL |
| 6081 | Victor Franca Didier | victordidier_@hotmail.com | 5581979070227 | DentalGo Anual R$58,00 | 5800 | months | active | 2026-04-09 20:04:49 | NULL |
| 10989 | Vinicius do Nascimento Borges | viniciusdnborges@gmail.com | 5551981005859 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-06-05 19:38:43 | NULL |
| 9284 | Vinicius Eduardo Mazzo | viortopesca@gmail.com | 5518997736569 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-08-20 13:02:42 | NULL |
| 6992 | Viviane Rocha | vivierkmann@gmail.com | 5544999497014 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-12-10 18:16:59 | NULL |
| 3618 | Wellington Medeiros | wellingtonvmedeiros@hotmail.com | 55 18 997832301 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-07-26 17:45:06 | NULL |
| 4769 | William Carlos Silva Barbosa | drwilliambarbosa@hotmail.com | 5522999093040 | DentalGo Anual R$58,00 | 5800 | months | active | 2024-08-30 18:31:14 | NULL |
| 4055 | Wilson Maia de Oliveira Junior | ortomaia@gmail.com | 55 981003300 | DentalGo Anual R$58,00 | 5800 | months | active | 2025-03-10 18:10:16 | NULL |
| 33123 | Betina Manzato | betina.manzato@unesp.br | 1171982277222 | DentalGO Cortesia | 0 | months | active | 2025-10-02 19:41:03 | NULL |
| 2928 | Bianca Paiva | bianca.leao@gmail.com |  | DentalGO Cortesia | 0 | months | active | 2026-06-08 20:47:53 | NULL |
| 38874 | Carla Caldeira Silva | carlac.silva@outlook.pt | +351 966850889 | DentalGO Cortesia | 0 | months | active | 2026-04-24 14:49:53 | NULL |
| 38872 | Carlota Maria Ramos da Costa | carlotamrcosta@gmail.com | +351 911598691 | DentalGO Cortesia | 0 | months | active | 2026-04-24 14:49:52 | NULL |
| 38895 | Carolina Martins Fernandes | carolinafernandes97@gmail.com | + 351 969 575 541 | DentalGO Cortesia | 0 | months | active | 2026-04-27 14:29:37 | NULL |
| 38879 | Cláudia Isabel Paulo Semião Bastos Lopes | orto.claudias@gmail.com | 351927831073 | DentalGO Cortesia | 0 | months | active | 2026-04-24 14:49:54 | NULL |
| 33080 | Concepcion Moreu | morel.concepcion.py@gmail.com |  | DentalGO Cortesia | 0 | months | active | 2025-09-26 13:01:07 | NULL |
| 38897 | Diana Gomes Correia | dianagcorreia@hotmail.com | +33783431309 | DentalGO Cortesia | 0 | months | active | 2026-04-27 14:29:37 | NULL |
| 38893 | Elisa Mariana Ferreira Carreiro Martins | elisafcarreiro@gmail.com | +351 915532026 | DentalGO Cortesia | 0 | months | active | 2026-04-27 14:29:36 | NULL |
| 33125 | Érica Mayumi Omoto | erika.omoto@unesp.br |  | DentalGO Cortesia | 0 | months | active | 2025-10-02 19:43:36 | NULL |
| 21445 | Filipa Martins Amante | filipa_amante@hotmail.com | 33 766683718 | DentalGO Cortesia | 0 | months | active | 2026-04-27 14:31:14 | NULL |
| 33122 | Iana Isabelle F. De Oliveira | li.oliveira@unesp.br |  | DentalGO Cortesia | 0 | months | active | 2025-10-02 19:39:24 | NULL |
| 16427 | Isabela Alice Stela | isabelastela@hotmail.com |  | DentalGO Cortesia | 0 | months | active | 2024-02-06 18:22:04 | NULL |
| 38875 | Joana Ferreira da Silva Baptista | joana.baptista62@gmail.com | +351 926807370 | DentalGO Cortesia | 0 | months | active | 2026-04-24 14:49:53 | NULL |
| 7662 | Juan Andree Uribe Ponce | uribeponcejuanandree@gmail.com | 55992781644 | DentalGO Cortesia | 0 | months | active | 2026-06-02 18:36:02 | NULL |
| 33085 | Kelly Fernanda Molena | kelly.molena@usp.br | 5516997038802 | DentalGO Cortesia | 0 | months | active | 2025-09-26 17:41:43 | NULL |
| 16225 | Lais De Paula Sumback Sivila Souza | laisps3@gmail.com |  | DentalGO Cortesia | 0 | months | active | 2025-11-24 18:20:33 | NULL |
| 6058 | Laurindo Furquim | laurindo@furquim.com.br | 5544999185160 | DentalGO Cortesia | 0 | months | active | 2022-06-17 17:10:37 | NULL |
| 23021 | Leonidas Munhoz Araujo | DENTISTALEONIDAS@GMAIL.COM |  | DentalGO Cortesia | 0 | months | active | 2026-06-08 20:48:31 | NULL |
| 33124 | Leticia Mayumi Nagao | leticia.nagao@unesp.br | 5515998297542 | DentalGO Cortesia | 0 | months | active | 2025-10-02 19:42:26 | NULL |
| 33624 | Lorena Caselato Ceron | lorenacceron@gmail.com | 5544998481584 | DentalGO Cortesia | 0 | months | active | 2025-11-03 19:57:05 | NULL |
| 38699 | LUCIANE MATCHULA | lucianematchula@yahoo.com.br |  | DentalGO Cortesia | 0 | months | active | 2026-03-17 15:42:28 | NULL |
| 39276 | Luiz Renato Paranhos | paranhos.lrp@gmail.com |  | DentalGO Cortesia | 0 | months | active | 2026-06-19 11:53:39 | NULL |
| 38873 | Margarida Parreira Fernandes Cortes Cavaco | mpfccavaco2000@hotmail.com | +351 962837086 | DentalGO Cortesia | 0 | months | active | 2026-04-24 14:49:53 | NULL |
| 38878 | Maria Carolina Da câmara Melo | mccm1996.18@gmail.com | 351914461921 | DentalGO Cortesia | 0 | months | active | 2026-04-24 14:49:54 | NULL |
| 38894 | Maria Vitória Ribeiro Pereira Lameiro | vitorialameiro.01@gmail.com | 351916979544 | DentalGO Cortesia | 0 | months | active | 2026-04-27 14:29:36 | NULL |
| 39118 | Mariana Campos de Almeida Alvarenga | marianacampos09@hotmail.com | 5538999054692 | DentalGO Cortesia | 0 | months | active | 2026-06-08 20:49:05 | NULL |
| 7705 | Marketing Dental Press | comunicacao@dentalpress.com.br |  | DentalGO Cortesia | 0 | months | active | 2021-06-24 18:41:05 | NULL |
| 10050 | Mauricio Eguez Zabala | maurieguez@hotmail.com | 591 76022624 | DentalGO Cortesia | 0 | months | active | 2025-08-13 17:23:38 | NULL |
| 38876 | Monica Luísa Santos Vasconcelos | monicalsvasconcelos@gmail.com | 351968221539 | DentalGO Cortesia | 0 | months | active | 2026-04-24 14:49:53 | NULL |
| 33084 | Pâmela Migliorato Corsi | pamelamigliorato@gmail.com | 5516992088944 | DentalGO Cortesia | 0 | months | active | 2025-09-26 17:39:03 | NULL |
| 6082 | Pedro Rosa | ti@dentalpress.com.br | +55 4430339804 | DentalGO Cortesia | 0 | months | active | 2021-06-24 18:54:11 | NULL |
| 33126 | Raisa Giovanna R. Martins | raissa.ros@unesp.br | 5517997312282 | DentalGO Cortesia | 0 | months | active | 2025-10-02 19:48:51 | NULL |
| 38896 | Raquel Sofia Silva Ferreira | raquel.s.ferreira94@gmail.com | +351 916 922 476 | DentalGO Cortesia | 0 | months | active | 2026-04-27 14:29:37 | NULL |
| 33081 | Raul Vera | raulmvera@hotmail.com |  | DentalGO Cortesia | 0 | months | active | 2025-09-26 13:01:45 | NULL |
| 38892 | Rita Isabel Martins Ferreira Jost | ritafjost@gmail.com | 041789736164 | DentalGO Cortesia | 0 | months | active | 2026-04-27 14:29:36 | NULL |
| 38877 | Rita Sofia de Silva Couto e Freitas Ferreira | rita.sofia.ferreira@hotmail.com | +351 924480278 | DentalGO Cortesia | 0 | months | active | 2026-04-24 14:49:53 | NULL |
| 38869 | Roció Nunez | Cacarisimoapodaca@gmail.com |  | DentalGO Cortesia | 0 | months | active | 2026-04-23 17:36:46 | NULL |
| 33144 | Saulo Regis Jr | ortodontia@sauloregisjr.com.br | 7132452998 | DentalGO Cortesia | 0 | months | active | 2025-10-06 18:00:13 | NULL |
| 33713 | Sergio Roberto de Oliveira Caetano | srocaetano@gmail.com |  | DentalGO Cortesia | 0 | months | active | 2025-11-17 17:18:44 | NULL |
| 7976 | Silvia de Morais Cavalcanti | s-cduarte@hotmail.com | 5581991377774 | DentalGO Cortesia | 0 | months | active | 2026-06-08 18:26:24 | NULL |
| 38854 | Sonia Piskorowska | Piskorowska@quintessenz.de |  | DentalGO Cortesia | 0 | months | active | 2026-04-20 14:46:59 | NULL |
| 3936 | Thais Maria Freire Fernandes Poleti | thaismaria@hotmail.com |  | DentalGO Cortesia | 0 | months | active | 2026-03-10 17:03:52 | NULL |
| 7255 | Victor Manuel Farfan Rueda | victorfarfanrueda@gmail.com | 992727058 | DentalGO Cortesia | 0 | months | active | 2026-06-08 20:47:27 | NULL |
| 2831 | Alana Costa | alana.vale@hotmail.com | 5584999550424 | DentalGO Internacional - R$ 78,00 | 7800 | months | active | 2021-01-08 13:25:48 | NULL |
| 1765 | Bianca Ferreira | bianlima@gmail.com |  | DentalGO Internacional - R$ 78,00 | 7800 | months | active | 2021-01-08 13:30:57 | NULL |
| 4757 | Durval Santos | durvasantos@hotmail.com | +55 11997730746 | DentalGO Internacional - R$ 78,00 | 7800 | months | active | 2021-01-08 13:52:46 | NULL |
| 3323 | Luiza Correia | luiza.nayara@yahoo.com.br | 5577999890266 | DentalGO Internacional - R$ 78,00 | 7800 | months | active | 2021-01-08 14:05:22 | NULL |
| 6228 | Maria Ines Domenech | domenech2903ines@gmail.com | +595 985987471 | DentalGO Internacional - R$ 78,00 | 7800 | months | active | 2021-01-08 14:05:21 | NULL |
| 5490 | Raniere Sousa | contato@ranieresousa.com.br | 55 84988981673 | DentalGO Internacional - R$ 78,00 | 7800 | months | active | 2021-01-08 13:25:41 | NULL |
| 3959 | Sebastian Jimenez | sebastian@webdental.cl |  | DentalGO Internacional - R$ 78,00 | 7800 | months | active | 2021-01-08 13:35:07 | NULL |
| 2432 | Jose  Alberto Garcia | jagortodontia@gmail.com | +55 34999761821 | DentalGo Promocional Grupo R$ 50,00 | 5000 | months | active | 2021-01-08 13:46:31 | NULL |
| 2157 | Luciana Ferreira de Toledo Maizato | lucianaftoledo@gmail.com | +55 11 983063371 | DentalGo Promocional Grupo R$ 50,00 | 5000 | months | active | 2021-01-08 14:05:22 | NULL |
| 2727 | Valeria Saraiva | vcmsaraiva@bol.com.br |  | DentalGo Promocional Grupo R$ 50,00 | 5000 | months | active | 2021-01-08 13:47:48 | NULL |
| 5412 | ELPIDIO NATAL JUNIOR | saudebucal@hotmail.com |  | DentalGo Promocional Grupo R$ 50,00 + Revista Impr... | 7000 | months | active | 2021-01-08 14:08:06 | NULL |
| 8954 | ANNA PAULA NIGRI | annapaulanigri@gmail.com | 552195537193 | DentalGO R$ 78,00 - Recorrente | 7800 | months | active | 2025-11-11 12:25:34 | NULL |
| 19599 | Ana Glaucia de Oliveira Macedo | glauciamacedo.ortodontia@hotmail.com | 5584998592035 | DentalGo Recorrente - R$ 58,00 | 5800 | months | active | 2024-07-24 17:05:20 | NULL |
| 1169 | Carlos Eduardo Nassif Makluf | cadunassa@bol.com.br | 5517991639516 | DentalGo Recorrente - R$ 58,00 | 5800 | months | active | 2024-05-17 18:21:29 | NULL |
| 15644 | Pedro Paulo Ferreira | drppferreira_orto@outlook.com | 55 329913257292 | DentalGo Recorrente - R$ 58,00 | 5800 | months | active | 2023-11-13 13:19:38 | NULL |
| 15901 | Isnayra Kerolaynne Carneiro Pacheco | isnayrapacheco@gmail.com | 5587991844649 | DentalGo Recorrente - R$ 68,00 | 6800 | months | active | 2024-02-19 19:24:34 | NULL |
| 2852 | Livia Shimohara | liys92@gmail.com | 55 11975001992 | DentalGo Recorrente - R$ 68,00 | 6800 | months | active | 2023-10-11 18:10:45 | NULL |
| 32704 | �urea iglesias | aureaiglesiasporta@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:34:59 | NULL |
| 32735 | ABBAS NASSEREDDINE | abbasnd313@icloud.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:09 | NULL |
| 15749 | Ademar Yukinori Ishii | ademar.yukinori@gmail.com | 5544999943276 | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 20:10:49 | NULL |
| 32744 | Alexandre lopes Virgulino de Medeiros | alexandre.virgulino@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:11 | NULL |
| 22656 | Allison Pereira Benites | allisonpb@gmail.com | 5567998248094 | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 20:11:42 | NULL |
| 32726 | Ana Claudia Rocha Barbosa | cacaurochab@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:07 | NULL |
| 32758 | Ana Elisa Schwartz Rosa Guernieri | doutora.anaelisa@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:15 | NULL |
| 32705 | Ana Maria | anamariadeol@yahoo.com.br |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:34:59 | NULL |
| 32753 | Ana Paula Pavarina | pavarinaodontologia@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:13 | NULL |
| 32752 | Arlete barbosa santos | arleteperio@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:13 | NULL |
| 32770 | B�rbara Vechi Cargnin Falchetti | barbaravechi@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:18 | NULL |
| 32729 | Beatriz dos Reis Nabarrete Garcia | drabeatrizreis@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:08 | NULL |
| 32763 | Beatriz dos Reis Nabarrete Garcia | drabeatrizreisn@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:17 | NULL |
| 32748 | Bianca Salvino Caride Piovezan | bia.salvino@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:12 | NULL |
| 32759 | Daniele mello | daniclete@yahoo.com.br |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:15 | NULL |
| 16882 | DEBORAH TEREZA REZENDE CORDEIRO | deborahtrcordeiro@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 20:13:57 | NULL |
| 32754 | Denner Pinto | dennerlucapinto@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:14 | NULL |
| 32755 | Ednan Mendes Onibene | ednan_onibene@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:14 | NULL |
| 16902 | EDUARDO MARTINEZ | martinezeduardo94@yahoo.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 20:13:08 | NULL |
| 32732 | Fabiana Rebelatto Begnami | rbfabiana@yahoo.com.br |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:08 | NULL |
| 32719 | Fabiano de Oliveira Almeida | drfabianoalmeida@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:04 | NULL |
| 32728 | Felipe leury leal farias | fariaasaa@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:07 | NULL |
| 32743 | Fernanda Lopes | fefalopes13@icloud.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:11 | NULL |
| 32711 | Fhaira Renata Moreira Barboza | fhaira_mbarbosa@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:00 | NULL |
| 32730 | Flavia Viviani Martins Quintana | wika1@uol.com.br |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:08 | NULL |
| 32718 | Franco Rocha Villela | lab.franco@yahoo.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:03 | NULL |
| 32706 | Gabriela Andreghette Vieira | gabyandreghetti@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:34:59 | NULL |
| 32710 | George Pereira Malheiros Tolentino | georgepmtolentino@outlook.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:00 | NULL |
| 32717 | Gicela Fuzetto | gicelafuzetto@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:03 | NULL |
| 32716 | Gustavo Gamba Abel | gustavoabel97@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:02 | NULL |
| 32720 | Iara Vieira de Andrade | iara.iandrade7@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:04 | NULL |
| 32757 | Ilana Rebello de Paula Teixeira Fleury | ilanateixeira@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:15 | NULL |
| 32724 | Jessica Aguiar | dra.jessica.nazario@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:06 | NULL |
| 32742 | Jo�o Marcos Boim de Freitas | joaomboim@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:11 | NULL |
| 16948 | JOS GUILHERME TAVARES TOLENTINO | jg_tolentino@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 20:14:48 | NULL |
| 32721 | Juarez ver�ssimo da Silva | juarezverissimooo@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:05 | NULL |
| 32764 | Juliana Lobo Ferreira | drajulianalobo89@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:17 | NULL |
| 32715 | K�tia Coelho Neves | katiaodontoneves@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:02 | NULL |
| 32738 | KELI CRISTINA FERNANDES Campos | kelicfcampos@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:10 | NULL |
| 32708 | Leandro Felippe Plenter Freire | leandrofpfreire@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:34:59 | NULL |
| 32765 | LEONARDO FERRONATTO DE SOUZA | leoferronatto@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:17 | NULL |
| 16959 | LUANA BATISTA LEAL MACHADO | luanaibj@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 20:12:36 | NULL |
| 32709 | luana neres demarco | luana_demarco@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:00 | NULL |
| 32767 | Luciana Fontes | lucianafontesdesouzamoreira@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:17 | NULL |
| 32768 | LUCY KATO KOBAYASHI | lucykato5@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:18 | NULL |
| 32736 | Luzmarina Amaral | luzmarinamaral@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:09 | NULL |
| 32751 | M�RCIA MARIA DE FRAN�A | marciafranca_2@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:13 | NULL |
| 32737 | Marcelo Noronha de Oliveirw | consorriso@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:09 | NULL |
| 32722 | marcio batista eiras | marciorose6373@yahoo.com.br |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:06 | NULL |
| 32762 | Marcos Conrado Singui | Marcoscsingui@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:16 | NULL |
| 16952 | MARIA ELISA BORTOT SOARES | gramfinal@outlook.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 20:12:13 | NULL |
| 32746 | Marl�cia | malumaninho@yahoo.com.br |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:11 | NULL |
| 32713 | Mateus | odontologiamateus@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:01 | NULL |
| 32756 | Matheus Pereira Candido | mathpereira2296@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:14 | NULL |
| 32714 | MATHEUS SEGATTO | matheus_segatto@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:01 | NULL |
| 2494 | Mauro Colleoni | colleonimr@uol.com.br |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 20:13:36 | NULL |
| 32707 | mayra le senechal horta | mayra.senechal@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:34:59 | NULL |
| 32739 | Michelle Guedes Panacioni | dramichellepanacioni@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:10 | NULL |
| 32740 | Murillo Rinaldi Bianchi | murillo_135@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:10 | NULL |
| 32734 | neilda abadia de oliveira | neildaabadia@bol.com.br |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:09 | NULL |
| 32733 | Nelida Gusman Turri Benedetti | nelidaturri@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:09 | NULL |
| 32769 | Neusa A. Marrafon Zanetti | neusamzanetti@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:18 | NULL |
| 32727 | Patricia Bahls de Almeida Farhat | palmeidaf7@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:07 | NULL |
| 29917 | Paulo Souza Nascimento | paulonasct@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 20:14:18 | NULL |
| 32723 | Qu�nia de Assis Silva Megale | queniamegale@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:06 | NULL |
| 32747 | Rafael Vieira de Almeida | rhafael.vieira@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:12 | NULL |
| 32750 | Raquel Santos de Oliveira | raquel.santtos@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:12 | NULL |
| 32725 | Renata Schendes Louren�o | renataschendes19@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:07 | NULL |
| 32745 | Rita de Cassia | embirucu@yahoo.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:11 | NULL |
| 5188 | Sara Todero | sararbtodero@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 20:11:23 | NULL |
| 32741 | Suely Midori Ohara | suelyoh@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:10 | NULL |
| 32749 | Ta�s Cristina da Rosa | taiscristina77@hotmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:12 | NULL |
| 17023 | TANIA CRISTINA DA COSTA MAGALHAES | taniaccm@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 20:15:14 | NULL |
| 32760 | Tha�s Rigo Barreiros | thaisrigobarreiros@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:15 | NULL |
| 32731 | Thiago alves costa | thiagobsce@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:08 | NULL |
| 32712 | Vinicius marques | vncskaiess@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:01 | NULL |
| 32761 | Viviane Duran | Vivianeduran@gmail.com |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:16 | NULL |
| 32766 | Wander de Almeida Silva | wanderdealmeida@uol.com.br |  | Fabiano Marson - DentalGO | 1 | months | active | 2025-08-21 19:35:17 | NULL |
| 39244 | Adriana Nogaroto Pinguello | adriananoping@hotmail.com | +55 44 97371 9760 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:52 | NULL |
| 39266 | Ana Flávia Bissoto Calvo | anacalvo@alumni.usp.br | +55 11 99191 6046 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:57 | NULL |
| 39226 | Ana Luiza Berto Signori | analuizasignori@hotmail.com | +55 14 98102 1495 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:49 | NULL |
| 39235 | Ana Luiza Bogaz Debortolli | analuizabdebortolli@gmail.com | +55 17 99122 2083 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:51 | NULL |
| 39254 | Angélica Rosa Soares | angelrosat@hotmail.com | +55 14 99183 4937 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:54 | NULL |
| 39255 | Athos Costa Assis | athoscassis@hotmail.com | +55 43 99614 9686 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:54 | NULL |
| 39232 | Beatriz Souza Campos | biasouzacampos@hotmail.com | +55 15 99773 8955 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:50 | NULL |
| 39245 | Bruna Carraro | brunacarraro88@gmail.com | +55 14 99878 1173 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:52 | NULL |
| 39236 | Bruna Franciele Oliveira | bruna.odontologia1@gmail.com | +55 34 99820 0898 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:51 | NULL |
| 39227 | Candido Campanha Neto | netocampanha@yahoo.com.br | +55 14 97400 1904 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:49 | NULL |
| 39256 | Daniela Maria Garcia Cappellano | dradanielacapellano@gmail.com | +55 11 99286 8841 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:54 | NULL |
| 39228 | Danilo Araujo Santos | odontobastosaraujo@gmail.com | +55 11 94884 4830 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:49 | NULL |
| 39257 | Ester Franco | esterfranco.ufpa.br@gmail.com | +55 91 83910 0494 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:55 | NULL |
| 39246 | Franciele Pires De Campos Rodrigues | francielepiresrodri@gmail.com | +55 14 99885 3176 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:53 | NULL |
| 39270 | Guilherme Capelozza | gcapelozza@gmail.com |  | Instituto Capelozza | 1 | months | active | 2026-06-16 12:44:23 | NULL |
| 39237 | Guilherme Monteiro Mendonça | guilhermemendonca_@hotmail.com | +55 67 98191 3621 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:51 | NULL |
| 38159 | Iasmim da Fonseca Barros | ODONTOPEDIASMIM@GMAIL.COM |  | Instituto Capelozza | 1 | months | active | 2026-06-15 21:00:38 | NULL |
| 39238 | Isabela Camargo | bellacamargo3@hotmail.com | +55 16 98220 0156 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:51 | NULL |
| 39247 | Isabela Camera Bueno Simpione | draisabelacamera@gmail.com | +55 17 99711 2855 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:53 | NULL |
| 39239 | Isabelle Maria Roldão De Souza | isabellemroldao@gmail.com | +55 14 99674 3495 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:51 | NULL |
| 39253 | Isadora Medeiros | isadoramedeiros@usp.br | +55 84 99909 0257 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:54 | NULL |
| 39240 | Ismail Carlos | netobriquezi123@gmail.com | +55 14 92000 6432 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:51 | NULL |
| 39265 | Janine Soares Morato | nine_morato@hotmail.com | +55 24 99971 0925 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:57 | NULL |
| 39241 | João Pedro Dias Moreira | joaopdm1915@gmail.com | +55 84 98166 4488 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:52 | NULL |
| 39258 | Jonathan Rafael Garbim | jrgarbim7@hotmail.com | +55 11 97093 1120 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:55 | NULL |
| 39259 | Karina Simonelly | karinasimonelly@gmail.com | +55 17 99725 0101 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:55 | NULL |
| 39233 | Larissa Torres Rodrigues Pinto | laritorresrodrigues@gmail.com | +55 14 99184 4187 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:50 | NULL |
| 39242 | Laura Iolanda Souza Reis | lauraiolanda@hotmail.com | +55 75 99124 2277 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:52 | NULL |
| 39260 | Letícia Santos Maciel | leticia.maciellsm@gmail.com | +55 11 95127 9936 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:55 | NULL |
| 39261 | Leticia Tami Almeida Amorim Ikejiri | leticia.ikejiri@gmail.com | +55 14 99752 9696 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:56 | NULL |
| 39234 | Leticia Van Blommenstein Rodrigues | leticiavanb@gmail.com | +55 91 99904 2422 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:50 | NULL |
| 39229 | Lilian Carvalho Caliani | liliancaliani@hotmail.com | +55 14 99744 0197 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:49 | NULL |
| 35429 | Livia Camargo Ortega | LIVIACORTEGA@GMAIL.COM |  | Instituto Capelozza | 1 | months | active | 2026-06-15 21:00:25 | NULL |
| 39248 | Livia Vicente | livia.vicente1@hotmail.com | +55 14 99693 3190 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:53 | NULL |
| 39262 | Lorena Teixeira Melo Bomfim | lorenamelo.odontoped@gmail.com | +55 34 99125 7730 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:56 | NULL |
| 39243 | Maitê Gonçalves Lins | financeiroclinicaleblanc@gmail.com | +55 67 99153 1426 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:52 | NULL |
| 39230 | Mariana dos Santos Torquato | torquatomariana@hotmail.com | +55 14 99783 3429 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:49 | NULL |
| 39263 | Mariana Rossi Carneiro Gasperini | mariana.rcgasperini@gmail.com | +55 11 99120 1747 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:56 | NULL |
| 39264 | Paulo David Sousa Borges | paulodavidsb@gmail.com | +55 37 88081 2340 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:56 | NULL |
| 39249 | Rharessa Gabrielly Ferreira Mendes | rharessam@gmail.com | +55 14 98105 2322 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:53 | NULL |
| 39250 | Sara De Andrade Pereira | sara.sdape@gmail.com | +55 35 99233 3870 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:53 | NULL |
| 39251 | Shanguily Toma Cota | shanguily2609@gmail.com | +51 946 789 539 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:53 | NULL |
| 39231 | Vinicius Melon Scudeler | viniciusscudeler@hotmail.com | +55 14 99604 8512 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:50 | NULL |
| 39252 | Yasmin Rosalin Francelino Moreira | yasrosalin@gmail.com | +55 14 99654 1716 | Instituto Capelozza | 1 | months | active | 2026-06-15 20:58:54 | NULL |
| 33865 | �TILA ROBERTO RODRIGUES | atilarobertousp@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:01 | NULL |
| 33818 | ADENIR JO�O BIESEK | abiesek@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:37 | NULL |
| 33819 | AIRA MARIA BONFIM SANTOS | bonfimaira@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:38 | NULL |
| 18571 | Alberto Ayres Suarez | albertosuarezdds@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:36:30 | NULL |
| 33820 | Alessah Carolyna de Andrade Alessah Fernandes | acandrafer@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:39 | NULL |
| 33821 | Alex Fran�a da Silva | dralexfranca@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:40 | NULL |
| 33822 | ALEXANDRE AUGUSTO FERREIRA DA SILVA | alexandre.ortognatica@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:40 | NULL |
| 33823 | ALEXANDRE BASUALDO | a.basualdo@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:41 | NULL |
| 33824 | ALEXANDRE ELIAS TRIVELLATO | eliastrivellato@forp.usp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:42 | NULL |
| 33825 | Alexandre Machado Torres | alexandremtorres@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:42 | NULL |
| 33826 | ALEYSSON OLIMPIO PAZA | pazaface@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:43 | NULL |
| 33827 | Alfredo Otto Kirst Neto | dralfredobuco@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:43 | NULL |
| 33828 | Alice Guedes Uch�a Torres Moreno | aliceguedes12@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:43 | NULL |
| 23171 | Aline Adelaide Paz da Silva Duarte | draalinepaz@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:59:27 | NULL |
| 33829 | Aline Coelho Gonzalez Peres | alinecgp@unicamp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:44 | NULL |
| 18590 | Aline Elizabeth Batista | alinelizabeth@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:42:19 | NULL |
| 23316 | Aline Garcia Ferreira Esmeraldino | dra.alineesmeraldino@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:43:20 | NULL |
| 18591 | ALINE MONISE SEBASTIANI | sebastiani.aline@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:44:13 | NULL |
| 23185 | Alinne Bortoloso | alinnebortoloso@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:46:39 | NULL |
| 33830 | ALISSON DE CARVALHO CHAVES | alissoncchaves@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:45 | NULL |
| 23220 | Allan Alyson simão de Sousa | allan-simao1@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:47:15 | NULL |
| 18594 | Allan Feliciani | rossefeli@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:27:51 | NULL |
| 18595 | Allan Vincius Martins de Barros | allanmartinsodonto@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:27:38 | NULL |
| 18593 | ALLANCARDI DOS SANTOS SIQUEIRA | allancardi@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:51:18 | NULL |
| 33831 | ALUISIO GALIANO | ag_galiano@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:46 | NULL |
| 18596 | Aluisio Martins de Oliveira Ruellas | aluisioruellas@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:55:36 | NULL |
| 33832 | ALYSSON GUILHERME VIEIRA SANTOS | alyvieirasantos@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:46 | NULL |
| 33833 | Amanda Barbosa de Godoy | dra.amandagodoy@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:46 | NULL |
| 18598 | AMAURI ANTONIO GUIMARAES | iurama44@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:21:07 | NULL |
| 15226 | AMY BRIAN COSTA E SILVA | AMYBRIANCS@GMAIL.COM | 5527997340290 | JBCOMS | 1 | months | active | 2025-12-17 14:10:54 | NULL |
| 33834 | Ana Beatriz Acosta Matos Rios | beatrizmodonto@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:47 | NULL |
| 33835 | Ana Beatriz Elias | aninhabeatriz280460@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:47 | NULL |
| 18599 | ANA CAROLINA NIEHUES NUNES | anacarolina.odo@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:38:30 | NULL |
| 23053 | ANA CLÁUDIA AMORIM GOMES | draanagomesbucofacial@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:34:10 | NULL |
| 23292 | Ana Eliza Lopes Barbosa | anaelizabarbosa22@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:55:20 | NULL |
| 18601 | Ana Gabriela Carvalho Rocha | anagcrochavrb@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:31:28 | NULL |
| 33836 | Ana Karina de Medeiros Tormes | karinatormes@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:48 | NULL |
| 33837 | Ana Lucia Carpi Miceli | anacarpimiceli@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:48 | NULL |
| 23266 | Ana Luiza Becker | analuizabecker17@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:23:26 | NULL |
| 33838 | Ana Marcely Amorim Dal Col | anamarcelyadc@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:49 | NULL |
| 33839 | ANA PAULA DA CUNHA BARBOSA DE LIMA | anapaula.bmf@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:49 | NULL |
| 33840 | Ana Paula Massote Pestana | anapaulampestana@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:49 | NULL |
| 33841 | ANDR� BARRETO GONZALEZ | andrebgonzalez@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:50 | NULL |
| 33842 | Andr� Machado Vilela | andremv@hotmail.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:50 | NULL |
| 33843 | Andr� Pereira Falc�o | andre.falcao@usp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:51 | NULL |
| 33845 | ANDR� SAKIMA SERRANO | andresakima@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:51 | NULL |
| 33846 | ANDR� VAJGEL FERNANDES | avajgel@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:52 | NULL |
| 33847 | Andr� Vitor Alves Ara�jo | andrearaujo.bmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:52 | NULL |
| 33848 | Andr� Xavier Padilha Favoreto | andrexpfavoreto@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:52 | NULL |
| 33849 | ANDR�A WILLEMANN | dheaw2010@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:53 | NULL |
| 18608 | ANDRE HENRIQUE DE ALMEIDA E SILVA | ahmleme@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:04:31 | NULL |
| 18609 | André Martins Narciso | profacelages@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:09:12 | NULL |
| 18610 | ANDRÉ PEDROSO | pedrosoandre@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:10:13 | NULL |
| 33844 | ANDRE RAMOS FERRARI | ferrariar@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:51 | NULL |
| 33850 | Andrey Moreira Candido | dr.andreycandido@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:53 | NULL |
| 33851 | ANGELO JOS� PAVAN | ajpavanctb@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:54 | NULL |
| 23057 | ANGELO MENUCI NETO | menuci@icloud.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:13:20 | NULL |
| 33852 | ANIBAL HENRIQUE BARBOSA LUNA | dr.anibal.luna@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:54 | NULL |
| 33855 | ANT�NIO ALBUQUERQUE DE BRITO | antonioabrito@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:56 | NULL |
| 33858 | Ant�nio Brunno Gomes Moror� | brunno.mg@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:57 | NULL |
| 33859 | ANT�NIO CAPISTRANO  F. NOBRE NETO | antoniocapistrano@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:57 | NULL |
| 33860 | Ant�nio Carlos Maluli de Oliveira | maluliac@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:57 | NULL |
| 33861 | ANT�NIO MARCIO TEIXEIRA MARCHIONNI | drmarciomarchionni@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:58 | NULL |
| 33862 | Ant�nio Pires da Silva Neto | silvanetoap@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:58 | NULL |
| 33854 | ANTHONY FROY BENITES CONDEZO | Anthony10003@icloud.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:55 | NULL |
| 33856 | ANTONIO AUGUSTO CAMPANHA | clinicacampanha@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:56 | NULL |
| 33857 | Antonio Augusto de Melo da Silva | antonioaugustoms@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:56 | NULL |
| 18622 | ANTÔNIO AUGUSTO PRETTO | adminhc@hcpf.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:10:49 | NULL |
| 18624 | ANTÔNIO DE FIGUEIREDO CAUBI | afcaubi@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:09:46 | NULL |
| 18625 | Antonio Eduardo Ribeiro Izidro | eduardoizidro@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:09:28 | NULL |
| 18626 | ANTÔNIO FÁBIO VIEIRA | antoniofabiovieira@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:08:56 | NULL |
| 18627 | ANTONIO IRINEU TRINDADE NETO | netoriocontas@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:07:48 | NULL |
| 18628 | ANTONIO LUCINDO PINTO DE CAMPOS SOBRINHO | antoniolucindo1@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:07:10 | NULL |
| 33863 | ANTONIO RENATO SANCHES COLUCCI | coluccioffice@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:28:59 | NULL |
| 18629 | ANTÔNIO REZENDE DE ALMEIDA | csfelipe@ig.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:00:49 | NULL |
| 18630 | ANTONY MAXIMINO MARTINS | antonymmartins@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 19:37:12 | NULL |
| 18631 | Anusca Fetter dos Santos Pavei | anusca.fetter@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:54:19 | NULL |
| 33864 | Arthur Von Muller Zugel | arthurvonmullerzugel@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:00 | NULL |
| 33866 | B�rbara Elizabeth Rocha Chimanski | dra.barbararocha@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:01 | NULL |
| 33867 | BEATRIZ DAQUINO MARINHO | beatriz.dmarinho@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:01 | NULL |
| 33868 | Beethoven Estev�o Costa | beethovencosta@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:02 | NULL |
| 33869 | BELINI FREIRE MAIA | belinimaia@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:02 | NULL |
| 23324 | Bianca Castro de Oliveira | bianca_01oliveira@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:15:43 | NULL |
| 18648 | Bianca de Fátima Borim Pulino | biancapulino@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:16:03 | NULL |
| 18649 | Bianca Rosa da Silva Melo | biaors27@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:23:12 | NULL |
| 33870 | Bibiana Mello da Rosa | bibiana.mello@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:04 | NULL |
| 33871 | Braz da Fonseca Neto | brazneto2511@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:04 | NULL |
| 33872 | Breno Gon�alves Daroz | bgdaroz@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:04 | NULL |
| 33873 | BRENO RIBEIRO ARENA | brenoarena@live.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:05 | NULL |
| 18652 | BRENO SOUZA BENEVIDES | brenobenevidesctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:24:58 | NULL |
| 18650 | BRULIO CARNEIRO JÚNIOR | brauliocj@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:23:44 | NULL |
| 33874 | Bruna Aparecida Alves Lima | brunaaparecida_lima1@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:05 | NULL |
| 33875 | Bruna maria agra vital pessoa cavalcante | brunavitalpessoa@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:06 | NULL |
| 33876 | Bruna Pelozo Palma | anbodontologia@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:06 | NULL |
| 18655 | BRUNA RODRIGUES FRONZA | brunarf@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:26:29 | NULL |
| 33877 | Bruna Sartori | brunasartori2019@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:06 | NULL |
| 18659 | BRUNO BRASIL MARECHAL | brunobrasilmarechal@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:23:54 | NULL |
| 23222 | Bruno Coelho Mendes | bruno.c.mnds@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:30:22 | NULL |
| 18660 | BRUNO COSTA FERREIRA | BRUNOC.MAXILOFACIAL@GMAIL.COM |  | JBCOMS | 1 | months | active | 2025-12-17 14:31:09 | NULL |
| 33878 | Bruno de Ara�jo Pinho Costa | dr_brunoaraujo@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:07 | NULL |
| 18661 | BRUNO DE LIRA CASTELO BRANCO | castelobrancobruno@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:32:57 | NULL |
| 33879 | Bruno de Macedo Santana | bruno_santana11@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:08 | NULL |
| 18662 | Bruno Faccin Colao | bkbuco1@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:33:12 | NULL |
| 18663 | Bruno Frota Amora Silva | frotab@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:33:29 | NULL |
| 33880 | Bruno Guardieiro | brunoguardieiro@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:08 | NULL |
| 33881 | Bruno Henrique de Oliveira | bruno.ctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:09 | NULL |
| 18665 | BRUNO LUIZ MENEZES DE SOUZA | brunomenezes1905@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:50:10 | NULL |
| 23152 | Bruno Marques Sbardelotto | brunomsbardelotto@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:49:53 | NULL |
| 33882 | Bruno Miranda Silva Lima | drbrunomiranda@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:10 | NULL |
| 10471 | BRUNO NIFOSSI PRADO | brunoprado8@gmail.com | 5511993312231 | JBCOMS | 1 | months | active | 2025-12-17 14:21:49 | NULL |
| 33883 | Bruno Nogueira Carneiro | bruno.carneirobv@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:10 | NULL |
| 18666 | Bruno Nunes Correa | brunomaxilofacial@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:21:27 | NULL |
| 33884 | BRUNO PAGLIUSE | bpagliuse@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:10 | NULL |
| 33885 | Bruno Rodrigo Boos Xavier Goncalves | brunorbxgoncalves@outlook.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:11 | NULL |
| 33886 | BRUNO SANTOS VICENTE | ctbmf.brunovicente@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:11 | NULL |
| 18667 | Bruno Trevisan | trevisan.bru@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:13:57 | NULL |
| 23193 | Bruno Velho Kuhn | brunokuhn2@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:11:22 | NULL |
| 18668 | BRUNO VIEZZER FERNANDES | brunoatleticano@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:22:47 | NULL |
| 33898 | C�ssio Edvard Sverzut | cesve@forp.usp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:17 | NULL |
| 33899 | C�ssio Ribeiro Campos | kassio_rc@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:17 | NULL |
| 33887 | Caio Henrique de Almeida Cruz | caiocruzgbt56@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:12 | NULL |
| 33888 | Caio Jesus de Souza | caio.jesus@unesp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:12 | NULL |
| 33889 | Calebe Lamonier de Oliveira Costa Paiva | calebelamonier@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:13 | NULL |
| 33890 | Camila Chinaglia | camilachinaglia@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:13 | NULL |
| 33891 | Camila Longoni | longoni.camila@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:13 | NULL |
| 23173 | Camila Soares Estevam | camilaestevam11@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:53:08 | NULL |
| 18675 | Cândida Seffrin Willers | candidaseffrin@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:52:13 | NULL |
| 33892 | Carla Cislayne Moura Fernandes | carlacislayne10@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:14 | NULL |
| 18678 | Carla Pantaleo Prestes | carlaprestesctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:53:40 | NULL |
| 18680 | CARLOS ALBERTO NOVELLI ASSEF | carlosassef@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 17:48:06 | NULL |
| 33893 | CARLOS ALBERTO TIM�TEO | ctimoteo@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:14 | NULL |
| 18681 | CARLOS ALBERTO ZOLIN | cazolin@live.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:51:32 | NULL |
| 33894 | CARLOS AUGUSTO DAS NEVES | caco.neves@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:15 | NULL |
| 18683 | CARLOS CESAR DE ANTONI | ccdeantoni@yahoo.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:48:25 | NULL |
| 18686 | Carlos Eduardo Mendona Batista | carlos_bmf@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:53:25 | NULL |
| 33895 | Carlos Perceu Tesoni | dr.carlos@tesoni.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:15 | NULL |
| 33896 | Carolina Chiantelli Cl�udio | dracarolinachiantelli@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:16 | NULL |
| 18689 | Carolina dos Santos Padula Ruperez | cprcontato@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:27:06 | NULL |
| 33897 | Carolina Santos Ventura de Souza | carolina.ventura@outlook.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:16 | NULL |
| 18690 | Caroline Bortolas de Carvalho | carolbortolas@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:31:39 | NULL |
| 18691 | Caroline Hartel | hartel.c@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:56:09 | NULL |
| 18692 | Caroline Hoffmann Bueno | carolhbueno@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:47:49 | NULL |
| 23268 | Caroline Leite Rodrigues | carolineleiteeee@icloud.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:47:33 | NULL |
| 33900 | CAU� TERRA CORDEIRO | cauaterra@drcauaterra.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:18 | NULL |
| 33901 | CEC�LIA LUIZ PEREIRA STABILE | ceciliastabile@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:18 | NULL |
| 23061 | CELSO HENRIQUE NAJAR RIOS | celsorios559@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:46:20 | NULL |
| 23187 | CESAR BARROS DE ALBUQUERQUE | cesarb.a@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:46:02 | NULL |
| 18697 | CHARLES MARIN | marinbuco@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:45:44 | NULL |
| 18699 | CINTHYA PINTO SILVA | cinthyapinto2010@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:43:51 | NULL |
| 21624 | CINTIA ELIZA ROMANI | cintiaelizaromani@gmail.com | 5549999339890 | JBCOMS | 1 | months | active | 2025-12-17 17:43:36 | NULL |
| 33904 | CL�UDIO LESSA | lessa.claudio@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:20 | NULL |
| 18703 | CLARI PEDRINHO BAU | claribau@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:42:59 | NULL |
| 23078 | CLARICE MAIA SOARES DE ALCANTARA PINTO | dra.claricemaia@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:42:04 | NULL |
| 33902 | Clarina Louis Silva Meira | clarinalouiscks@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:19 | NULL |
| 18705 | CLAUDIO CEZAR FRANCALACCI | ccf@matrix.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:59:07 | NULL |
| 33903 | CLAUDIO CLARO MARTINS | claroclin@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:20 | NULL |
| 33905 | Claudio Ramirez Pascual | contato@claudiopascual.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:20 | NULL |
| 33922 | D�bora Cedraz Santiago Lima | deboracedraz96@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:27 | NULL |
| 33923 | D�bora Helena Balcevicz | deborab.odonto@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:28 | NULL |
| 33906 | DANIEL AUGUSTO GAZIRI | danielgaziri@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:21 | NULL |
| 33907 | DANIEL BARROS RODRIGUES | dbarrosr@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:22 | NULL |
| 33908 | Daniel Serra Cassano | cassano.face@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:23 | NULL |
| 33909 | DANIELA PRATA TACCHELLI | dradanielaprata@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:23 | NULL |
| 33910 | Daniella Estanho De Lima Flavio | dani.estanho@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:23 | NULL |
| 33911 | Danielle Alves Paes Santos | dradaniellepaes@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:24 | NULL |
| 33912 | DANIIL ISRAEL SANTOS FERREIRA | drdaniilctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:24 | NULL |
| 33913 | DANILO DOS SANTOS ARAUJO | DANILODONTO@GMAIL.COM |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:24 | NULL |
| 33914 | Danilo Fran�a Cavalcanti | danilofcv123@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:25 | NULL |
| 33915 | DANILO LOBO MUSSALEM | DANILOMUSSALEM@HOTMAIL.COM |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:25 | NULL |
| 33916 | DANILO PASSEADO BRANCO RIBEIRO | dpasseado@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:25 | NULL |
| 33917 | DARCENY ZANETTA BARBOSA | darceny_@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:25 | NULL |
| 33918 | Dario Javier Rivera Coronel | dariorivera477@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:26 | NULL |
| 33919 | DAVANI LATARULLO COSTA | costabuco@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:26 | NULL |
| 33920 | Davi Francisco Casa Blum | daviblum@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:26 | NULL |
| 33921 | DAVID MORAES DE OLIVEIRA | davidoliveira78@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:27 | NULL |
| 33924 | DEBORA RODRIGUES FONSECA | dradeborabuco@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:28 | NULL |
| 33925 | Denis Dami�o Costa | drdenisctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:29 | NULL |
| 33926 | DENIS PIMENTA E SOUZA | drdenispimenta@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:29 | NULL |
| 33927 | Diego Portes | odontoportescursos@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:29 | NULL |
| 33928 | DIOGO SOUZA FERREIRA RUBIM DE ASSIS | rubimdiogo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:30 | NULL |
| 32196 | Diones C. de Quadros | dionesquadros2012@gmail.com |  | JBCOMS | 1 | months | active | 2025-07-30 16:37:24 | NULL |
| 33929 | Dirceu Virgolino de Oliveira | drdirceuvirgolino@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:31 | NULL |
| 33930 | Dominique Santana Alves | dominique.santanaa@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:31 | NULL |
| 33931 | Edson de Almeida Murta Junior | edsonmurtajrc@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:32 | NULL |
| 33932 | EDUARDO AZOUBEL | azoubel.eduardo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:33 | NULL |
| 33933 | Eduardo Dib Souza Santos Jerez | dr.eduardodj@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:34 | NULL |
| 33934 | Eduardo Esberard Favilla | eduardoefavilla@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:34 | NULL |
| 33935 | Eduardo Liberato da Silva | edu.liberato.s@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:35 | NULL |
| 33936 | EDUARDO LUIS GERHARDT | eduger69@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:35 | NULL |
| 33937 | EDUARDO MEURER | emeurer.cirurgia@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:35 | NULL |
| 33938 | EDUARDO MORESCHI | moreschi.maxilofacial@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:35 | NULL |
| 33939 | EDUARDO PEDRO DE CARVALHO FILHO | dr.eduardocf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:36 | NULL |
| 18754 | EDUARDO SANCHES GONALES | eduardogoncales@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:37:48 | NULL |
| 6110 | Eduardo Santana | esantana@usp.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:31:56 | NULL |
| 33940 | Eduardo Santana Jacob | eduardosjacob@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:36 | NULL |
| 18755 | Eduardo Seixas Cardoso | educardos@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:36:43 | NULL |
| 33941 | EDUARDO STEHLING URBANO | esurss@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:37 | NULL |
| 33942 | EDYNELSON DA SILVA GOMES | edynelsongomes@outlook.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:37 | NULL |
| 33943 | Emanuele dos Santos Moreira | smemanuele06@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:39 | NULL |
| 33944 | Enderson Pellito Filho | endersonpellito@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:40 | NULL |
| 33945 | Ernandes Aparecido Santos | proteseodonto@bol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:40 | NULL |
| 33946 | ERNANDES ARANTES DE OLIVEIRA | drernandesctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:40 | NULL |
| 33947 | Evaldo Henrique Pessoa da Costa | evaldohenrique98@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:41 | NULL |
| 33948 | EVANS SOARES DE OLIVEIRA | evansoliveira@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:41 | NULL |
| 33949 | EVERTON LUIS SANTOS DA ROSA | zazai547@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:42 | NULL |
| 33950 | Everton Rodrigues | everton.projenet@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:42 | NULL |
| 33951 | F�BIO KRICHELDORF | proface@mac.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:43 | NULL |
| 33952 | F�bio Tadeu Ferreira Rodrigues | fabbiotadeu@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:44 | NULL |
| 33953 | FELIPE DE FARIAS DA SILVEIRA | ffsilvei@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:45 | NULL |
| 33954 | FELIPE LADEIRA PEREIRA | fladeirapereira@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:45 | NULL |
| 33955 | Felipe Oliveira de Souza | felipeolisouza35@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:46 | NULL |
| 23277 | Felipe Seoane Matos | f.seoane.odonto@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:46:20 | NULL |
| 33956 | FERDINANDO DE CONTO | decontoferdi@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:46 | NULL |
| 18275 | FERNANDA BOING | boingbuco@gmail.com | 554899965385 | JBCOMS | 1 | months | active | 2025-12-17 14:10:36 | NULL |
| 33957 | FERNANDA BRASIL DAURA JORGE BOOS LIMA | fernandabrasilboos@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:46 | NULL |
| 18791 | FERNANDA JOLY MACEDO | fernandajolym@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:43:19 | NULL |
| 33958 | FERNANDO ANTONIO HORTA JUNIOR | bucomaxilo17990@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:47 | NULL |
| 18793 | FERNANDO BASTOS PEREIRA JNIOR | fernandobastospj@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:45:07 | NULL |
| 18794 | FERNANDO CESAR AMAZONAS LIMA | fcalima1706@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:44:48 | NULL |
| 18795 | Fernando de Oliveira Andriola | fernandoandriola@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:44:25 | NULL |
| 18798 | Fernando Jordo de Souza Junior | ctbmfjordao@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:44:00 | NULL |
| 23128 | FERNANDO KENDI HORIKAWA | fernandokendi@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:10:06 | NULL |
| 18799 | FERNANDO MELHEM ELIAS | fmelias@usp.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:09:40 | NULL |
| 33959 | FERNANDO REGIOLI | fernandoregioli@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:48 | NULL |
| 33960 | Fernando Ruas Esgalha | contato@fernandoesgalha.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:48 | NULL |
| 18801 | FERNANDO ZUGNO KULCZYNSKI | fernando_z@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:09:22 | NULL |
| 33961 | FL�VIO FID�NCIO DE LIMA | flavioflima@me.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:49 | NULL |
| 33962 | FL�VIO WELLINGTON DA SILVA FERRAZ | flavio.ferraz@hc.fm.usp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:49 | NULL |
| 18802 | FLÁVIO ALVES DE ANDRADE | drflavioandrade@drflavioandrade.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:08:59 | NULL |
| 18803 | FLÁVIO HENRIQUE SILVEIRA TOMAZI | fhtomazi@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:08:14 | NULL |
| 23205 | Francielle Alves dos Santos | francialves8452@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:07:04 | NULL |
| 18805 | FRANCISCO AURELIO LUCCHESI SANDRINI | francisco.bucofacial@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:06:48 | NULL |
| 18806 | FRANCISCO DE ASSIS SILVA LIMA | assiscro@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:06:31 | NULL |
| 33963 | Francisco Wagner V Freire Filho | wagnerbmf1@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:50 | NULL |
| 18807 | FRANKLIN DAVID GORDILLO YPEZ | fran81gy@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:05:57 | NULL |
| 18808 | Franklin Telmo Salazar Arce | franklinarce@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:35:08 | NULL |
| 33964 | FREDERICO COIMBRA DA ROCHA | fredrochadds@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:51 | NULL |
| 33965 | Frederico Cotrim Rodrigues | fredericocotrimrodrigues@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:51 | NULL |
| 10768 | Frederico Felipe Antonio de Oliveira Nascimento | fredericofelipe@gmail.com | 5561984329464 | JBCOMS | 1 | months | active | 2025-12-16 19:34:30 | NULL |
| 18810 | Frederico Vicenzo Barbosa Biggi Carnevale | frederico.carnevale@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:34:17 | NULL |
| 33966 | Frederico Yonezaki | fredericoyonezaki@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:51 | NULL |
| 18811 | FUED SAMIR SALMEN | drfued@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:33:47 | NULL |
| 33967 | Gabriel Antonio Ramos Caetano | bielantonio275@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:52 | NULL |
| 18814 | GABRIEL CONCEIO BRITO | gabrielcbrito7@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:12:01 | NULL |
| 33968 | GABRIEL CUNHA COLLINI | gabrielccollini@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:52 | NULL |
| 33969 | GABRIEL CURY BATISTA MENDES | curymendes@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:52 | NULL |
| 18815 | GABRIEL DENSER CAMPOLONGO | gcampolongo@unidor.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 19:26:19 | NULL |
| 33970 | Gabriel Ferreira Fonseca | gabrielffon@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:53 | NULL |
| 33971 | Gabriel Haddad | gakalluf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:53 | NULL |
| 23310 | Gabriel Pengo da Costa | gacosta84@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:24:58 | NULL |
| 33972 | Gabriel Ramos R�bio | gabrielramosrubio10@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:53 | NULL |
| 33973 | Gabriela Alves Pinto | dra.gabrielaalves@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:53 | NULL |
| 18812 | Gabriela Caovilla Felin | GABIFELIN@GMAIL.COM |  | JBCOMS | 1 | months | active | 2025-12-16 19:19:27 | NULL |
| 33974 | Gabriela Carmo de Melo | melocgabriela@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:54 | NULL |
| 33975 | Gabriela dos Santos D�rr | gabrieladsd11@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:54 | NULL |
| 23149 | Gabriela Kalinsqui Lopes | g166968@dac.unicamp.br |  | JBCOMS | 1 | months | active | 2025-12-16 19:17:07 | NULL |
| 33976 | GABRIELA MAYRINK GON�ALVES | dragabrielamayrink@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:55 | NULL |
| 3077 | Gabriela Porto | gabiporto99@yahoo.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:17:24 | NULL |
| 33977 | George Emanuel Gon�alves Bulhoes | gbulhas@icloud.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:55 | NULL |
| 33978 | Gilberto Leal Grade | g_lg@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:56 | NULL |
| 33979 | Giovanna Marconato Santi | dragiovannamarconato@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:57 | NULL |
| 33980 | Giulia Quarentei Barros Brancher | dra.giuliabrancher@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:57 | NULL |
| 33981 | GLEISSE WANTOWSKI | GLEISSEW@GMAIL.COM |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:58 | NULL |
| 33982 | Guilherme da Cunha Almeida | guilhermedacunhaalmeida@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:29:59 | NULL |
| 18842 | GUILHERME LACERDA DE TOLEDO | drguilhermelacerda@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:46:51 | NULL |
| 18843 | GUILHERME OMIZZOLO | guilhermeomizzolo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:47:09 | NULL |
| 18844 | Guilherme Pivatto Louzada | drguilhermelouzada@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:50:33 | NULL |
| 33983 | GUILHERME ROMANO SCARTEZINI | g_scartezini@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:00 | NULL |
| 33984 | Guilherme Strujak | gstrujak@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:00 | NULL |
| 23077 | Gustavo Batista Grolli Klein | gutoklein@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 19:50:54 | NULL |
| 18845 | Gustavo Bellozi de Araujo | bellozi@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:56:03 | NULL |
| 33985 | GUSTAVO CAVALCANTI DE ALBUQUERQUE | gusal.buco@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:01 | NULL |
| 4712 | Gustavo Farah | gustavojfarah@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:03:30 | NULL |
| 18846 | GUSTAVO GAFRE BRAZ | gugabraz@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:03:13 | NULL |
| 23072 | GUSTAVO JOSÉ DE LUNA CAMPOS | camposctbmf@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:04:11 | NULL |
| 33986 | Gustavo Lopes Barreto | gustavobarreto7@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:02 | NULL |
| 33987 | GUSTAVO ROCHA NOGUEIRA | gusrnogueira10@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:03 | NULL |
| 33988 | GUTO FIDALGO DAUMAS MORAES | gutofdm@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:04 | NULL |
| 33989 | HELENA BACHA LOPES | helena_lopes@yahoo.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:05 | NULL |
| 23245 | Heloisa Fonseca Marão | heloisafonsecamarao@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:11:12 | NULL |
| 18853 | Henrique Cabrini Moreira | hcm.cirurgia@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:11:32 | NULL |
| 18854 | HENRIQUE DAURO MARTIGNAGO | sem-email-432@email.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:05:41 | NULL |
| 18855 | HENRIQUE DUQUE DE MIRANDA CHAVES NETTO | henrique.duque@ufjf.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:15:19 | NULL |
| 18857 | Henrique Gabriel Ferreira | henriqueg.f.1995@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:15:36 | NULL |
| 18858 | HENRIQUE MARTINS FRANA BORGES | henriquemfb@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:44:21 | NULL |
| 18859 | Henrique Tedesco de Oliveira | htedesco99@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:42:30 | NULL |
| 33990 | Henrique Telles Ramos de Oliveira | drhenriquetelles@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:07 | NULL |
| 33991 | Henry Perlovski | henrybucomaxilo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:08 | NULL |
| 18861 | HERBERT DE ABREU CAVALCANTI | herbertcavalcanti_@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:41:24 | NULL |
| 18862 | Heric de Souza Camargo | heric.camargo@unesp.br |  | JBCOMS | 1 | months | active | 2025-12-16 18:03:55 | NULL |
| 23236 | Herica Paluze Calili Fiuza | herica.calili@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:06:01 | NULL |
| 33992 | Herick Cruz limeira | herickcruz@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:08 | NULL |
| 33993 | HERIK VINICIUS PORTES DE SOUZA | herik.vinicius@outlook.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:09 | NULL |
| 33994 | HERNANDO VALENTIM DA ROCHA JUNIOR | hernando.valentim@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:09 | NULL |
| 33995 | Heros Francisco Ferreira Filho | herosferreira11@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:09 | NULL |
| 33996 | Hildebrando de Azevedo Junior | hilde_jr@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:09 | NULL |
| 33997 | Hugo Serafim Gandra Nunes de Grand�o | hugogandra@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:09 | NULL |
| 33998 | Hyago Henrique Gon�alves Fran�a | henriquehyago53@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:09 | NULL |
| 18866 | Ingrid Navarro Andrade | ingridnavarro25@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:40:54 | NULL |
| 33999 | IOLANDA AM�LIA GRIBOGGI MANFRON | ioliagm@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:10 | NULL |
| 23243 | Iolanda Lídia Negrão | iolandanegrao@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:39:29 | NULL |
| 18868 | ISAAC LIMA NASCIMENTO BENAC | ibenac@antares.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 18:39:02 | NULL |
| 18870 | Isabela Polesi Bergamaschi | isabelapbergamaschi@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:38:30 | NULL |
| 18872 | Isadora Mello de Carvalho | isamlcarvalho@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:37:57 | NULL |
| 34000 | ISLA RIBEIRO DE ALMEIDA | isla.ctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:11 | NULL |
| 34001 | Israel Silva Correia | demandahospitalar@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:11 | NULL |
| 18874 | Ítalo de Lima Farias | italolimaf@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:37:33 | NULL |
| 18875 | IVETTE BECCALLI | ivebeccalli@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:37:10 | NULL |
| 23115 | Izabela Fornazari Delamura | izabela.delamura@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:35:54 | NULL |
| 34026 | J�lia Arrighi Silva | juarrighisilva@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:28 | NULL |
| 34027 | J�lia Morais Moreira | juliamoraismoreira06@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:28 | NULL |
| 34004 | J�nia Andreza Leite Braga | andreza.jania2@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:13 | NULL |
| 23208 | Jackson Lins de Oliveira | jacksonlins72@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:35:17 | NULL |
| 34002 | Jacqueline Rosa Gon�alves | drajacquelineg@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:12 | NULL |
| 18880 | JAN PETER ILG | jpilg@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 14:21:56 | NULL |
| 34003 | Janaina Silva Torres | janaina_torres_9@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:13 | NULL |
| 18879 | JANAYNA GOMES PAIVA OLIVEIRA | jgpaivaoliveira@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:02:31 | NULL |
| 34005 | Javan Araujo Cunha | javan.araujocunha@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:13 | NULL |
| 18881 | Jean Carlos Della Giustina | jcdgiustina@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 18:01:27 | NULL |
| 18882 | JEAN DE PINHO MENDES | cris.ramal@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:01:04 | NULL |
| 34006 | JEAN GLAYDSON DE SOUZA FIALHO | jeanfialho@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:14 | NULL |
| 18883 | Jeferson Martins Pereira Lucena Franco | jefersonlucenaodonto@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 17:59:37 | NULL |
| 4005 | JESSICA ALVES G. SIQUEIRA | jessicaags192@hotmail.com | 5543984041419 | JBCOMS | 1 | months | active | 2025-12-16 17:59:05 | NULL |
| 18885 | Jéssica da Silva Rodrigues | jessrodriges@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 17:58:31 | NULL |
| 23122 | Jessica da Silva Santos | saantosjessica14@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 17:57:33 | NULL |
| 34007 | Jessica Ferraz Barros Curi | jeucuri@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:15 | NULL |
| 23068 | JIMMY CHARLES MELO BARBALHO | jimmybarbalho@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 17:57:10 | NULL |
| 23159 | Jiordanne Araújo Diniz | jiordannectbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 17:56:45 | NULL |
| 34008 | Jo�o de Paula dos Santos | jhonedpds@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:17 | NULL |
| 34009 | JO�O FERREIRA DOS SANTOS JR. | joaosantosjr1970@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:17 | NULL |
| 34010 | JO�O GERALDO BUGARIN JUNIOR | bugarinjr@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:17 | NULL |
| 34011 | JO�O GUALBERTO DE CERQUEIRA LUZ | jgcluz@usp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:18 | NULL |
| 34012 | Jo�o Jos� Cossatis | joaocossatis@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:18 | NULL |
| 34013 | JO�O JULIO DA CUNHA FILHO | jjulio.voy@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:18 | NULL |
| 34014 | JO�O NUNES NOGUEIRA NETO | joaonnneto@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:19 | NULL |
| 34016 | JO�O V�TOR QUEIROZ MENDES DOS SANTOS | jvitorqueiroz@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:20 | NULL |
| 34015 | Jo�o Vitor Ferro Mileski | mileski.j@unoesc.edu.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:20 | NULL |
| 34017 | Jo�o Wictor do Nascimento Rodrigues | dr.joaowictor@icloud.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:20 | NULL |
| 23202 | João Batista da Silva Pereira Neto | joaobatistaneto12@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 14:34:15 | NULL |
| 15708 | João Bezerra Lyra Neto | itsjoaolyra@gmail.com | 5581988772221 | JBCOMS | 1 | months | active | 2025-12-16 14:33:48 | NULL |
| 18888 | JOÃO CARLOS BIRNFELD WAGNER | jcbwagner@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 14:33:29 | NULL |
| 18889 | JOAO CARLOS COLOMBINI | joao.oralprime@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 14:33:00 | NULL |
| 18890 | JOÃO CARLOS DA SILVA NETO | sem-email-119@email.com |  | JBCOMS | 1 | months | active | 2025-12-16 14:32:24 | NULL |
| 16210 | João de Andrade Garcez Filho | jgarcez_f@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 14:31:39 | NULL |
| 18891 | JOÃO FRANK CARVALHO DANTAS DE OLIVEIRA | joaofrankdantas@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 14:22:24 | NULL |
| 34018 | Johnny Ferreira de Lima Francisco | johnnyferreira96@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:20 | NULL |
| 18910 | JOS RENATO COSTA | jrenatocosta@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 18:18:14 | NULL |
| 34020 | JOS� LINCOLN CARVALHO PARENTE | lincolnparente@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:23 | NULL |
| 34022 | JOS� LUIS MU�ANTE C�RDENAS | jlmunante35@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:24 | NULL |
| 34023 | JOS� ROBERTO PITERI FILHO | dr.roberto@clinicapiteri.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:25 | NULL |
| 34024 | Jos� Valdir Pessoa Neto | valdirp9@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:26 | NULL |
| 34025 | JOS� WILSON NOLETO RAMOS JR. | drjosewilsonnoleto@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:27 | NULL |
| 34019 | Jose Abel Porto de Almeida | jabel@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:22 | NULL |
| 23051 | JOSÉ AFONSO DE ALMEIDA | j.afonsoalmeida@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:21:28 | NULL |
| 18904 | JOSÉ ALBERTO TAIAR | jataiar@interdont.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:22:14 | NULL |
| 23063 | JOSÉ ANTÔNIO FERREIRA RIOS | rios@clinicarios.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:22:30 | NULL |
| 23111 | José Augusto de Bem Pereira | augustodebem@outlook.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:23:18 | NULL |
| 18905 | JOSÉ CARLOS BERTOTTO | josecb@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:23:42 | NULL |
| 18906 | José Emílio Polinati | joseemiliopolinati@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:24:08 | NULL |
| 18907 | JOSÉ HUMBERTO MACEDO | JHBUCOMAXILO@GMAIL.COM |  | JBCOMS | 1 | months | active | 2025-12-16 18:13:45 | NULL |
| 34021 | JOSE LINEU PEREIRA OGOSHI | ogoshi@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:23 | NULL |
| 18908 | José Lopes de Oliveira Neto | josenetoctbmf@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:15:29 | NULL |
| 23055 | JOSE MARIA SAMPAIO MENEZES JUNIOR | sampaiomenezes@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:16:51 | NULL |
| 18909 | JOSÉ NAZARENO GIL | nazabuco@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:17:16 | NULL |
| 23080 | JOSE RIBAMAR ALEX DIAS | josectbmf2018@yahoo.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:19:18 | NULL |
| 18911 | JOSE RICARDO PEREIRA MARTINS | martins.josericardo@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:12:40 | NULL |
| 23037 | JOSÉ ROBERTO BARONE | drjosebarone@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:24:30 | NULL |
| 18913 | JOSÉ ROBERTO PINTO | jolugui01@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:24:52 | NULL |
| 18914 | JOSÉ RODRIGUES LAUREANO FILHO | laureano.filho@upe.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:25:17 | NULL |
| 18915 | José Rômulo de Medeiros | romulomedeiros.ctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:25:37 | NULL |
| 6783 | JOSÉ SANDRO PEREIRA DA SILVA | jspsilva@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:27:14 | NULL |
| 18916 | JOSÉ THIERS CARNEIRO JNIOR | jthiers53@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 18:23:40 | NULL |
| 18917 | José Wittor de Macdo Santos | josewittor@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:24:04 | NULL |
| 23260 | JOSLEI CARLOS BOHN | josleibohn@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:19:45 | NULL |
| 18918 | JOSUEL RAIMUNDO CAVALCANTE | josuelcavalcante@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:31:09 | NULL |
| 23105 | Juan Cassol | juancassolcolorado@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:31:27 | NULL |
| 23054 | JULIA MAKI KIHARA | juliakihara@icloud.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:11:48 | NULL |
| 18921 | Julia Monteiro Fabricio Skrivan | juh_skrivan@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:12:19 | NULL |
| 34028 | JULIANA CONCEICAO MARINHO DIAS | diasjul@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:28 | NULL |
| 34029 | Juliana Elias de Sousa | julianabucomaxilo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:29 | NULL |
| 34030 | Juliana Grazielli Jorge | dentistacatolica@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:29 | NULL |
| 23257 | Juliana Jorge Garcia | garcia.julianajorge@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:16:05 | NULL |
| 18923 | Juliana Moreira Chramosta | jusgmoreira@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:16:24 | NULL |
| 23074 | JÚLIO BISINOTTO GOMES | julio_bisinotto@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 12:19:55 | NULL |
| 34031 | Julio Cesar Cavalieri Moretti | julio.moretti@alumni.usp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:30 | NULL |
| 23102 | Júlio Maciel Santos de Araújo | juliovagga@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:20:18 | NULL |
| 23263 | Juvencio Ambrosio da Cunha Junior | juvenciocunhajr@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:20:41 | NULL |
| 34032 | Kaique Guerra Roque de Ara�jo | araujobucomaxilo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:30 | NULL |
| 34033 | Kalil Ayres Santana | kalilayres@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:30 | NULL |
| 34034 | Karoline Ferreira Farias Catarino | karolinefcatarino@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:31 | NULL |
| 23153 | Kelly dos Anjos Melo | kellyanjosm@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:23:15 | NULL |
| 34035 | KERLISON PAULINO DE OLIVEIRA | kerlisonpaulino@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:32 | NULL |
| 34036 | Kleyton Lacerda Valverde | drkleytonvalverde@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:32 | NULL |
| 22945 | Klinger Saciloto | ksaciloto@yahoo.com.br | 5519991515256 | JBCOMS | 1 | months | active | 2025-12-17 12:21:57 | NULL |
| 34037 | Korak Marciano de Souza | korakcirurgiao@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:32 | NULL |
| 34038 | Lara Eduarda Ferreira Ten�rio C�sar | laratenoriobuco@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:33 | NULL |
| 34039 | Lara Gabriely de Carvalho Pimenta | laragabriely15@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:33 | NULL |
| 18936 | Larissa Azeredo da Silva Lessa Nicolau | larissalessanicolau@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:10:35 | NULL |
| 34040 | Larissa Costa Pereira | dra.laricostapereira@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:33 | NULL |
| 23330 | LARISSA MAIA DOS SANTOS | larissamaiadossantos27@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:07:33 | NULL |
| 34041 | Laura Ferreira Martins | laurafm.odonto@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:34 | NULL |
| 18939 | LAURA HELENA APARECIDA AGUIRRE  D'OTTAVIANO | lauradottaviano@gmail.com | 5519996017043 | JBCOMS | 1 | months | active | 2025-12-17 11:44:39 | NULL |
| 34042 | Laura Maria dos Santos Reis Rocha de Castro | lauralmmaria@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:34 | NULL |
| 18941 | LAURINDO MOACIR SASSI | consultoriolaurindosassi@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:44:20 | NULL |
| 34043 | Layane Nunes Guimar�es Mendes | dralayanemendes@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:34 | NULL |
| 23062 | LEANDRO BENETTI DE OLIVEIRA | lebenetti2014@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:43:46 | NULL |
| 18943 | LEANDRO EDUARDO KLUPPEL | lekluppel@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:45:03 | NULL |
| 18944 | Leandro Junqueira de Oliveira | leojunq@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:03:14 | NULL |
| 18945 | LEANDRO NAPIER DE SOUZA | leandronapierdesouza@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:01:26 | NULL |
| 34044 | LEANDRO PEREIRA FLECHA | leandroflecha@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:35 | NULL |
| 18946 | LEANDRO SANTÀNNA DA COSTA | lesantanna@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 11:46:46 | NULL |
| 18947 | Leandro Santos Bicalho | bicalho11@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:46:28 | NULL |
| 18949 | LEANDRO SOUZA POZZER | leandrosouzapozzer@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:46:12 | NULL |
| 9007 | LECIO PITOMBEIRA PINTO | leciopinto@yahoo.com | 5585988880044 | JBCOMS | 1 | months | active | 2025-12-17 11:45:53 | NULL |
| 23081 | LEONARDO COSTA DE ALMEIDA PAIVA | almeidapaiva.leonardo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:45:35 | NULL |
| 18952 | LEONARDO GAMEIRO DE SOUZA | leogameiro@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:32:46 | NULL |
| 18954 | LEONARDO MEDINA FLORESTA | leoomedina@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:33:01 | NULL |
| 34045 | LEONARDO METROPOLO MOREIRA | leobuco@me.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:37 | NULL |
| 23075 | LEONARDO PEREZ FAVERANI | leobucomaxilo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:33:25 | NULL |
| 34046 | Leonardo Ramponi Golineleo | lrgolineleo@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:37 | NULL |
| 18956 | LEONILSON GAIO DE MELO | gaiao@drgaiao.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:33:47 | NULL |
| 34047 | LEVY HERMES RAU | raulevy@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:38 | NULL |
| 34048 | LINCOLN LARA CARDOSO | lincolnbuco@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:39 | NULL |
| 34049 | LIVIA MIRELLE BARBOSA | dra.liviabarbosa@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:39 | NULL |
| 34056 | LU�S FELIPE LUKSCHAL | luislukschal@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:45 | NULL |
| 34057 | Lu�sa Quevedo Grave | luisagrave@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:46 | NULL |
| 34050 | Lucas Henrique Farias Silva | drlucashenrique@icloud.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:41 | NULL |
| 34051 | Lucas Ribeiro Modesto | lribeiro_07@outlook.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:42 | NULL |
| 23156 | LUCAS SOUZA CERQUEIRA | lucasscerqueira@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:05:38 | NULL |
| 34052 | Lucas Yoshizawa de Marins | lucas.yoshizawa@usp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:42 | NULL |
| 34053 | Luciana Moreira de Lucena | lucianalucenaodonto@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:43 | NULL |
| 18976 | LUCIANA SIGNORINI | signorini.lu@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:36:04 | NULL |
| 18977 | Luciano Bocchi Facioli | lucianofacioli@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:36:20 | NULL |
| 18978 | LUCIANO CINCUR SILVA SANTOS | cincuraluc@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 12:39:37 | NULL |
| 19810 | Luciano Del Santo | luciano@neoface.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 12:44:15 | NULL |
| 18980 | LUCIANO ENGELMANN MORAIS | drlucianobuco@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:45:36 | NULL |
| 23097 | LUCIANO MAYER | clinica_mayer@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:45:54 | NULL |
| 18981 | LUCIANO PIRES PRTO | lookdents@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:51:41 | NULL |
| 34054 | LUCIANO SCHWARTZ LESSA FILHO | lucbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:44 | NULL |
| 18982 | LUCY DALVA LOPES MAURO | lucydalvalopesmauro@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 12:52:07 | NULL |
| 34055 | Ludmylla da Silva Rodrigues Labre | ludmyllalabre@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:45 | NULL |
| 18983 | LUIS AUGUSTO PASSERI | passeri@fcm.unicamp.br |  | JBCOMS | 1 | months | active | 2025-12-17 13:02:03 | NULL |
| 18984 | LUIS DE FREITAS BALDEZ | luisfbaldez@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:34:06 | NULL |
| 18985 | LUIS EDUARDO MARQUES PADOVAN | padovan@iocp.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:05:05 | NULL |
| 18986 | LUIS FERNANDO DE OLIVEIRA GORLA | fernando.gorla@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:04:51 | NULL |
| 18990 | Luiz Antonio Nerone | lanerone@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:04:38 | NULL |
| 34058 | LUIZ AUGUSTO VANTI | gutovanti@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:46 | NULL |
| 18991 | LUIZ CARLOS FERREIRA DA SILVA | lcsilva@infonet.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:04:17 | NULL |
| 18992 | LUIZ CARLOS MANGANELLO DE SOUZA | lc@manganello.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:04:03 | NULL |
| 18993 | Luiz Eduardo Silveira Duz | dudusilveiraduz@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:03:43 | NULL |
| 18995 | Luiz Felipe Silva Novy | luiznovyy@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 13:40:52 | NULL |
| 34059 | Luiz Fernando Gil | luiz.gil@ufsc.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:47 | NULL |
| 18996 | LUIZ FERNANDO GRACINDO | fernandogracindo@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:43:25 | NULL |
| 34060 | LUIZ FERNANDO MACHADO CALDART | dr.caldart@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:48 | NULL |
| 18997 | Luiz Gomes de Sousa | luizdesousa1@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:42:31 | NULL |
| 34061 | LUIZ HENRIQUE MOREIRA MARINHO | drluizhmmarinho@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:48 | NULL |
| 18998 | LUIZ JORGE DE ARAUJO GUEDES | luizjorgeguedes@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:40:42 | NULL |
| 34062 | Luiz Mauricio Rocha | luizmauricio07@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:48 | NULL |
| 34063 | Luiza Clertiani Vieira Alves | clertiani@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:49 | NULL |
| 34064 | Luiza Vale Coelho | luizavalec@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:49 | NULL |
| 19001 | Magno Liberato | contato@drmagnoliberato.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:41:54 | NULL |
| 19002 | Manoel de Jesus Rodrigues Mello | mjrmello@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:41:33 | NULL |
| 19003 | MANOEL EDUARDO CORREA COSTA | sem-email-436@email.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:41:14 | NULL |
| 19004 | Manuel Otavio S Schmitz | manuelschmitzz@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:40:56 | NULL |
| 19005 | MARCEL DA SILVA GARROTE | msgarrote@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:44:13 | NULL |
| 34065 | MARCEL GONCALVES VIEIRA | drmarcelvieira@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:50 | NULL |
| 19006 | MARCELO ARTUR CAVALLI | maccavalli@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:43:13 | NULL |
| 34066 | MARCELO AUGUSTO CINI | contato@drmarcelocini.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:50 | NULL |
| 34067 | MARCELO FERREIRA PINTO CARDOSO | cirurgia.marcelo@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:51 | NULL |
| 19008 | Marcelo Leite Machado da Silveira | marceloleitebuco@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:42:06 | NULL |
| 19009 | MARCELO MAROTTA ARAUJO | drmarceloaraujo@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:41:53 | NULL |
| 34068 | MARCELO MATOS ROCHA | marcelo.rocha00@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:51 | NULL |
| 19010 | MARCELO MELO SOARES | marcelomelo61@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:41:21 | NULL |
| 19011 | MARCELO NEWTON CARNEIRO | marceloncarneiro@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:41:05 | NULL |
| 19012 | Marcelo Oldack Silva dos Santos | marcelooldack@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:40:50 | NULL |
| 19013 | MARCELO PEREIRA DO NASCIMENTO | marcelopn@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:40:24 | NULL |
| 23221 | Marcelo Piaia | mppiaia@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:40:06 | NULL |
| 34069 | MARCELO RODRIGO DE SOUZA MELO | marceloctbmf@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:52 | NULL |
| 19015 | MARCELO ROSADO BOTELHO | doutorbotelho@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:39:18 | NULL |
| 34070 | Marcelo Santos Bahia | marcelosbahia@usp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:53 | NULL |
| 23058 | MARCELO SILVA MONNAZZI | monnazzi@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:32:06 | NULL |
| 34071 | MARCELO VARGAS SCH�TZ | schutzbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:53 | NULL |
| 19016 | MARCIEL ANTONIO ABDALA | marcielabdala@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:32:27 | NULL |
| 34072 | MARCIO ANDR� FERNANDES DA COSTA | mac@marcioandrecosta.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:54 | NULL |
| 19017 | MÁRCIO BRUNO FIGUEIREDO do AMARAL | marciobrunoamaral@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:31:47 | NULL |
| 23052 | MÁRCIO DE MORAES | mmoraes@fop.unicamp.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:38:42 | NULL |
| 19019 | Marcio Martins | marciomartinsbucomaxilo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:38:27 | NULL |
| 19020 | Marcio Martins da Silva | martinsodt@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:36:38 | NULL |
| 19021 | MÁRCIO OLIVEIRA SANTOS | cdmarciosantos@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:36:19 | NULL |
| 19022 | MÁRCIO ROSSI MASCARENHAS | marcmasc@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:35:59 | NULL |
| 34073 | MARCO AUR�LIO VERLANGIERI ALVES | mavalves@alumni.usp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:55 | NULL |
| 23219 | Marco Calle Zambrano | marcocalle64@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:35:20 | NULL |
| 23306 | MARCOS GUERRA ALVES | marcosguerraface@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:34:58 | NULL |
| 34074 | MARCOS HEIDY GUSKUMA | mhguskuma@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:55 | NULL |
| 19025 | Marcos Jose Barboni Maringoli | mmaringoli@icloud.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:34:39 | NULL |
| 34075 | MARCOS SABADIN | CLINICASABADIN@HOTMAIL.COM |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:56 | NULL |
| 34076 | Marcos Vinicios Rodrigues de Oliveira | mvinicios.pmm@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:56 | NULL |
| 19026 | Marcos Yassuda | marcosyassudaddos@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:44:47 | NULL |
| 34077 | Marcus Paulo de Resende Pereira | marcusresende51@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:56 | NULL |
| 34078 | Marcus Vinicius Satoru Kasaya | marcus.kasaya@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:57 | NULL |
| 34079 | Marcus Vinicius Wanka | marcuswanka@yahoo.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:57 | NULL |
| 34080 | MARIANA APARECIDA BROZOSKI | marianabrozoski@usp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:58 | NULL |
| 34081 | Mariana Silva Campos | marianas.campos@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:59 | NULL |
| 34082 | Marianna Coppo Scaramussa | mariscaramussa@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:30:59 | NULL |
| 34083 | MARISA APARECIDA CABRINI GABRIELLI | macg@foar.unesp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:00 | NULL |
| 34084 | MARTHA ALAYDE ALCANTARA SALIM | marthasalim@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:00 | NULL |
| 34085 | MATEUS CHERULLI NOVAES | novaesmateus@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:00 | NULL |
| 34086 | Matheus Dantas de Ara�jo Barretto | matheusdabarretto@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:01 | NULL |
| 34087 | Matheus Rodrigues Serafim Silva | m.atheus@live.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:02 | NULL |
| 34088 | MAUR�CIO SARAIVA MEIRELLES | drmmeirelles@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:03 | NULL |
| 34089 | Maur�lio Campos de Matos | mauriliomatos@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:03 | NULL |
| 23237 | Mauricio De Mendonça Pepe | mauriciopepep@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:46:25 | NULL |
| 19048 | Mauricio Flaminio Amato | amatoforp@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:46:44 | NULL |
| 19049 | MAURO GOMES TREIN LEITE | mautrein@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:47:33 | NULL |
| 34090 | Max Sweel Carvalho Carneiro | msweell@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:03 | NULL |
| 19050 | Maximiana Cristina de Souza Maliska | contato@dramaximiana.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:47:48 | NULL |
| 34091 | Mayco Rodrigues Pereira | maycocd@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:04 | NULL |
| 20632 | Meg Pagnan | megpagnan@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:48:25 | NULL |
| 19052 | MICHEL CAMPOS RIBEIRO | michelfurnas@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:48:42 | NULL |
| 34092 | MICHELE DOS SANTOS NOBRE | nobre_michele@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:04 | NULL |
| 19053 | Michelle Nascimento Meger | michellemeger@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:48:59 | NULL |
| 23176 | Michelle Paradella de Queiroz | michellep@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:46:01 | NULL |
| 19054 | MIGUEL HENRIQUE COLLAÇO | miguelcollaco@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 11:29:56 | NULL |
| 34093 | Miguel Pereira da Mata Santos | miguelpdamata@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:05 | NULL |
| 34094 | Mikaellen F. Paes Hippertt | mikaellenferreirapaes@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:05 | NULL |
| 19058 | MILLANE FABOLA COUTINHO DE LIRA DUARTE | millanefabiola@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 20:49:18 | NULL |
| 23309 | MILTON CRISTIAN RODRIGUES COUGO | drmiltoncougo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 10:54:43 | NULL |
| 34095 | Mirela Caroline Silva | mirela_carol12@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:06 | NULL |
| 19060 | MOACYR TADEU VICENTE RODRIGUES | mtadeuvr@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:50:15 | NULL |
| 23151 | Monalisa Sena da Costa | monalisasena-c@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:49:57 | NULL |
| 19061 | Monique Gonalves da Costa | moniquegc30@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:49:35 | NULL |
| 19062 | MURILLO CHIARELLI | muchiarelli@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 11:29:08 | NULL |
| 34096 | Mylena Milesi Pereira | mylenamilesi@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:07 | NULL |
| 34097 | N�dia Maria Pires Silva | nadiamaria79@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:07 | NULL |
| 19066 | Nara Valadares Gottardi | naravgottardi27@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:48:03 | NULL |
| 34098 | NATACHA KALLINE DE OLIVEIRA | natachakalline@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:08 | NULL |
| 19067 | NATAIRA REGINA MOMESSO | natairar@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:47:17 | NULL |
| 23280 | Natália Cavalcante | natalia_csilva@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:47:01 | NULL |
| 34099 | Natalia Garcia | natalia.garcia1@unesp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:08 | NULL |
| 34100 | Neander da Silveira Coelho | coelhoneander@yahoo.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:09 | NULL |
| 34101 | NEIMAR SCOLARI | neimar.scolari@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:09 | NULL |
| 34102 | NELSON LUIS BARBOSA REBELLATO | rebelato@ufpr.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:09 | NULL |
| 34103 | NELSON STUDART ROCHA | nelson.studart@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:09 | NULL |
| 34104 | Newton S�rgio Maximiliano | newton@doutornewton.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:10 | NULL |
| 19073 | NICOLAS HOMSI | nicolas@bucomaxilofacial.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:45:16 | NULL |
| 23234 | NICOLLAS BRENDOWN CODIGNOLLE DE SOUZA | nicollas-brendown@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:32:52 | NULL |
| 23264 | Nicolle da Silva Francisconi | nicolle_francisconi@live.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:34:19 | NULL |
| 34105 | Nielly Cristina Rosa | niellycristina@outlook.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:11 | NULL |
| 23224 | Nielson da Costa Ramos | nielson_vip@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:35:38 | NULL |
| 34106 | Nivea Cristina Ribeiro | nivea_ribeiro@yahoo.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:11 | NULL |
| 9545 | Octavio Cintra | octaviocintra@me.com | 551138877225 | JBCOMS | 1 | months | active | 2025-12-16 18:17:43 | NULL |
| 34107 | Olimpio Barbosa de Oliveira Neto | drolimpioneto@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:12 | NULL |
| 19079 | ONALDO AGUIAR | onaldo.aguiar@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:39:02 | NULL |
| 19080 | ORLANDINO RODRIGUES LEITE | orlandinorodriguesleite@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:39:43 | NULL |
| 19081 | OTACLIO LUIZ CHAGAS JNIOR | otaciliochagasjr@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:41:38 | NULL |
| 19082 | OTÁVIO EMMEL BECKER | beckerotavio@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:42:31 | NULL |
| 19084 | OTAVIO LUIZ FERRAZ | o.ferraz@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 11:42:59 | NULL |
| 19085 | PABLO DE SOUZA GONZALEZ | DR.PABLO.S.GONZALEZ@GMAIL.COM |  | JBCOMS | 1 | months | active | 2025-12-17 11:43:30 | NULL |
| 19086 | Patrcia dos Santos C | patysce@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:42:13 | NULL |
| 34108 | PATRICIA RUBIA MANIERI | drapatriciamanieri@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:13 | NULL |
| 34109 | PATRICIA SIQUEIRA DA SILVA BARCELLOS | siqueirapatriciasb@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:13 | NULL |
| 19090 | Paula Tavares Franzon | paulatfranzon@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:44:28 | NULL |
| 23096 | Pauline Magalhães Cardoso Brito | paulinebucomaxilo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:43:49 | NULL |
| 34110 | PAULO ALEXANDRE DA SILVA | institutodafacesjc@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:14 | NULL |
| 19093 | Paulo Cesar Capistrano de Pinho | pauloccapistranop@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 13:40:35 | NULL |
| 19094 | PAULO DOMINGOS RIBEIRO JUNIOR | paulodomingos@iocp.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:05:19 | NULL |
| 34111 | Paulo Eduardo Cherubini | paulo.cherubini@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:15 | NULL |
| 34112 | PAULO ESTEVES FARIA | p.faria@me.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:15 | NULL |
| 34113 | PAULO HENRIQUE DE SOUZA CASTRO | ph.castroph@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:15 | NULL |
| 34114 | PAULO HENRIQUE RODRIGUES CARVALHO | paulorodriguesbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:15 | NULL |
| 19096 | PAULO JOS D' ALBUQUERQUE MEDEIROS | pjm@superig.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:38:04 | NULL |
| 19097 | PAULO MARIA SANTOS RABLO | terezarabelo@bol.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:38:19 | NULL |
| 19098 | Paulo Matheus Honda Tavares | matheus_apj@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:38:44 | NULL |
| 19099 | PAULO NEY LYRA DE MORAES | pauloneybuco@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:38:59 | NULL |
| 34115 | PAULO NORBERTO HASSE | paulohasse@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:16 | NULL |
| 34116 | Paulo Ricardo Alves de Oliveira | prickdentista@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:16 | NULL |
| 34117 | PAULO ROBERTO BARBOSA JUNIOR | paulohsq@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:17 | NULL |
| 19101 | PAULO ROBERTO GUTIERREZ JUNIOR | drpaulogutierrez@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:01:10 | NULL |
| 34118 | Paulo Rog�rio Corr�a Couto | paulocouto.ctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:17 | NULL |
| 23200 | Paulo Sérgio Ferreira da Silva Filho | pauloferreirafilho.bmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 11:44:02 | NULL |
| 19103 | PAULO SÉRGIO PERRI DE CARVALHO | p.perri@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 12:06:56 | NULL |
| 19851 | Pedro Henrique da Hora Sales | salespedro@gmail.com | 5582996329484 | JBCOMS | 1 | months | active | 2025-12-17 12:10:12 | NULL |
| 19105 | Pedro Henrique de Azambuja Carvalho | carvalhopha@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:39:14 | NULL |
| 34119 | Pedro Henrique Justino Oliveira Limirio | pedro_hjlo@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:18 | NULL |
| 23076 | PEDRO PINTO BERENGUER | berenguer@outlook.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:39:31 | NULL |
| 23060 | PEDRO SÉRGIO DE MELO GUIMARÃES | drpedroguimaraes@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:39:53 | NULL |
| 34120 | Philippi Machado dos Reis | 1688.machado@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:18 | NULL |
| 19107 | PIETRY DY TARSO IN ALVES MALAQUIAS | pietrymalaquias@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:40:06 | NULL |
| 19108 | Plínio Abel Alexandre da Costa | plinioabel_medeiros@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 12:11:13 | NULL |
| 34121 | PRISCILA FALEIROS BERTELLI TRIVELLATO | priscilabertelli@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:19 | NULL |
| 34122 | Priscila Sell | priscilasell1@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:19 | NULL |
| 34123 | Priscilla Janaina de Lima Bovo | drapriscilla.cirurgiadaface@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:19 | NULL |
| 19112 | PYLYP NAKONECHNYJ NETO | pylyp@openlink.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 12:15:43 | NULL |
| 9847 | Rafael Alberto dos santos | rafaalberto@gmail.com | 5555992281672 | JBCOMS | 1 | months | active | 2025-12-17 12:14:16 | NULL |
| 23183 | Rafael Balbueno da Rocha | rafaeldarocha@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 12:13:57 | NULL |
| 34124 | Rafael Barbosa Moraes | drrbarbosa@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:20 | NULL |
| 34125 | Rafael da Silva Bonato | rafaelbonato@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:20 | NULL |
| 34126 | RAFAEL EVARISTO FERREIRA DOS SANTOS | dr@rafaelevaristo.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:21 | NULL |
| 34127 | Rafael Gon�alves Prudente Lima | r.prudente@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:21 | NULL |
| 19118 | Rafael Guimares Lima | rafaelguimaraeslima@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:16:31 | NULL |
| 19119 | RAFAEL RODRIGO FACCIO | rrfaccio@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:14:13 | NULL |
| 34128 | RAFAEL SEABRA LOURO | dr.rafaelseabra@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:22 | NULL |
| 34129 | RAFAEL VAGO CYPRIANO | rafaelcypriano@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:22 | NULL |
| 19120 | RAFAEL WEBER ROSA | r.websa@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:40:58 | NULL |
| 19114 | RAFAELA SCARIOT | rafaela_scariot@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:41:19 | NULL |
| 8411 | Rafaelle da Silveira Santos Kniess | rafaelle.silveira@gmail.com | 5541991644748 | JBCOMS | 1 | months | active | 2025-12-17 20:41:34 | NULL |
| 34130 | Rafahel Achilles Pacheco Pereira | rafahel_pereira@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:22 | NULL |
| 34131 | RAIMUNDO THOMPSON GON�ALVES FILHO | dr.thompsongoncalves@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:23 | NULL |
| 23116 | Rainde Naiara Rezende de Jesus | rainde.rezende@outlook.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:41:54 | NULL |
| 34132 | RALF GOBBO LIZA | ralf.liza@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:23 | NULL |
| 34133 | RAMIRO ANTONIO TEIXEIRA SILVA | ramirosilvacb@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:23 | NULL |
| 19124 | RAPHAEL CAPELLI GUERRA | dr.raphael.guerra@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 14:22:52 | NULL |
| 19544 | Raphael Marques Varela | varelarm@hotmail.com | 5548999829878 | JBCOMS | 1 | months | active | 2025-12-16 14:29:09 | NULL |
| 34134 | Raphael Mello Xavier | raphael.xavier95@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:24 | NULL |
| 19122 | RAPHAELA LAMA TRAVASSOS | travassos.raphaela@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:00:26 | NULL |
| 19127 | RAQUEL BASTOS VASCONCELOS | raquelbastosvasconcelos@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:02:12 | NULL |
| 34135 | Rauel Victor Dutra Ferreira | rauelufmg@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:24 | NULL |
| 19128 | RAUL FERNANDO KLEIN | clinicaraulklein@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:02:56 | NULL |
| 34136 | Rauly de Barros Pinto | raulydbarros@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:25 | NULL |
| 34137 | Rayane Ferreira Tindo | rayane.tindo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:25 | NULL |
| 34138 | Rayssa Nunes Villafort | rayssavillafort01@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:25 | NULL |
| 19129 | Rebeca Valeska Soares Pereira | rebecavaleska@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:39:47 | NULL |
| 19130 | REGIS AUGUSTO BARBOSA | regisaugustobarbosa@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:04:18 | NULL |
| 19132 | RENAN CAVALHEIRO LANGIE | renanlangie@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 18:04:45 | NULL |
| 34139 | Renan Ferreira Trindade | renan-trindade@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:26 | NULL |
| 19133 | RENATA HINHUG VILARINHO | mrcurado@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 18:05:07 | NULL |
| 34140 | RENATA MIRANDA NOGUEIRA | renatamirandactbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:26 | NULL |
| 19134 | Renata Pittella | pittella@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 18:05:32 | NULL |
| 34141 | Renata Prates Rodrigues Novaes | renata18prates@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:27 | NULL |
| 34142 | Renata Stifelman Camilotti | camilottirenata@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:27 | NULL |
| 30274 | Renato Behrens Pedreira | renatobehrens@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:13:22 | NULL |
| 34143 | RENATO CARDOSO DE OLIVEIRA | re.nato@live.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:27 | NULL |
| 19138 | RENATO DE QUEIROZ RAMOS | renatodequeirozramos@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:46:36 | NULL |
| 19139 | Renato Gomes Azevedo | renatogazevedo@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 20:04:50 | NULL |
| 19140 | RENATO LUIZ MAIA NOGUEIRA | renatolmaia@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 19:56:20 | NULL |
| 34144 | RENATO ROSSI JR. | rrossi@cermaf.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:28 | NULL |
| 34145 | RENATO SAWAZAKI | gestao.sdc@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:28 | NULL |
| 19142 | Renato Schroder dos Santos | renatoschroder100@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:42:09 | NULL |
| 34146 | Ricardo ALberto Heine | ricardoheine@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:29 | NULL |
| 14544 | ricardo augusto conci | ricardo_conci@hotmail.com | 5545999748956 | JBCOMS | 1 | months | active | 2025-12-17 20:42:27 | NULL |
| 23174 | Ricardo Augusto Gonçalves Pierri | ripierri@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:42:46 | NULL |
| 34147 | RICARDO DE P�DUA COELHO | rpadua.ctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:29 | NULL |
| 34148 | Ricardo de Sousa Coringa | ricardocoringa@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:30 | NULL |
| 19145 | RICARDO DIAS LOURENÇO | ricardolourenco.bmf13@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 19:12:28 | NULL |
| 34149 | RICARDO DOS REIS SANTIAGO SILVA | drricardodosreis@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:30 | NULL |
| 5866 | RICARDO FRANKLIN GONDIM | ricardofgondim@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:19:00 | NULL |
| 19148 | RICARDO JOSÉ DE HOLANDA VASCONCELLOS | ricardoholanda@bol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 19:21:42 | NULL |
| 19149 | RICARDO LUIZ CARVALHO GOTTARDI | cogottardi@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:22:14 | NULL |
| 23064 | RICARDO PEREIRA MATTOS | ricardopmattos@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 19:25:16 | NULL |
| 19150 | RICARDO RIBEIRO DURO | ricardodurao@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:25:38 | NULL |
| 19151 | Ricardo Sabino Panasco | rpanasco@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:32:47 | NULL |
| 23107 | Ricardo Schaurich | rs_schaurich@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:33:09 | NULL |
| 19152 | RICARDO VIANA BESSA NOGUEIRA | ricardobessa@msn.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:33:28 | NULL |
| 19153 | Richard Presley Silva Lima Brasil | richardpsl@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:34:02 | NULL |
| 34150 | RIEDEL FROTA S� NOGUEIRA NEVES | riedelfrota@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:32 | NULL |
| 23035 | ROBERTO ALMEIDA DE AZEVEDO | razevedo@ufba.br |  | JBCOMS | 1 | months | active | 2025-12-16 19:34:48 | NULL |
| 23204 | Roberto Botelho Correia Filho | clinica.robertobotelho@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:06:14 | NULL |
| 19156 | ROBERTO DIAS RGO | robertorego@unifor.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:07:52 | NULL |
| 19157 | Roberto Ferreira Zanin | robertofzanin@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:08:40 | NULL |
| 34151 | ROBERTO GOMES DOS SANTOS | robertobucomaxilo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:33 | NULL |
| 34152 | ROBERTO MORENO | contato@clinicarobertomoreno.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:33 | NULL |
| 19159 | ROBERTO PRADO | dr.prado@gbl.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 19:45:25 | NULL |
| 34153 | Robinson da Silva Ribeiro | rsrmabpa@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:33 | NULL |
| 19160 | ROBSON ALMEIDA DE REZENDE | rezendeclinica@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:45:45 | NULL |
| 19161 | ROBSON RODRIGUES GARCIA | dr.robsongarcia@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 19:46:03 | NULL |
| 34154 | Rodolfo Jorge Fortes Kubiak | dr.rodolfokubiak@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:34 | NULL |
| 16300 | Rodolfo Mendes Silva | rodolfomendessilva@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:43:03 | NULL |
| 34155 | RODOLPHO VALENTINI NETO | valentinineto@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:34 | NULL |
| 34156 | Rodrigo Alberto Cenci | rodrigocenci@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:34 | NULL |
| 34157 | Rodrigo Calado Nunes e Souza | primaface@primafacecampinas.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:35 | NULL |
| 19164 | RODRIGO FROMER FIGUEIRA | rodrigofromer@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:43:16 | NULL |
| 34158 | RODRIGO GRANATO | granatobuco@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:35 | NULL |
| 34159 | RODRIGO PINHEIRO RIBEIRO | rodrigo-pr@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:35 | NULL |
| 34160 | Rodrigo Santana Almeida | rodrigoalmeida.bmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:35 | NULL |
| 34161 | Rodrigo Sofia da Rocha | rsr.bmf@icloud.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:36 | NULL |
| 23148 | Rodrigo Uemura de Souza | uemura.rodrigo@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:43:32 | NULL |
| 23199 | Rodrigo Vilas Boas Sousa | rodrigoovilaasbooas@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:43:49 | NULL |
| 34162 | RODRYGO NUNES TAVARES | rodrygobmf@me.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:36 | NULL |
| 19168 | ROGER LANES SILVEIRA | rogerlanes@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:32:38 | NULL |
| 23034 | ROGER WILLIAM FERNANDES MOREIRA | cirurgia.rm@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:37:02 | NULL |
| 19166 | ROGERIO BELLE DE OLIVEIRA | rogeriobelle@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:44:02 | NULL |
| 34163 | Rogerio Jose Massao Tamura | drrogeriotamura@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:37 | NULL |
| 19167 | Rogerio Luiz de Araujo Vian | rogeriovian1972@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:44:24 | NULL |
| 19170 | ROMILDO JOSÉ DE SIQUEIRA BRINGEL | romildobringel@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:44:41 | NULL |
| 19172 | ROMULO LAZZARI MOLINARI | romulo220@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:44:55 | NULL |
| 19173 | RONALDO DE CARVALHO MIGUEL | profronaldo@implantesdentarios.odo.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:46:28 | NULL |
| 19174 | RONALDO VIEIRA DA VEIGA | ronaldodaveiga@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:48:23 | NULL |
| 34164 | Ronnys Ruggery Gomes da Silva | ronnys432@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:38 | NULL |
| 34165 | ROQUE MIGUEL RHODEN | cicofpf@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:38 | NULL |
| 23070 | ROSANA KALAOUN | rosanakalaoun@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:48:46 | NULL |
| 19175 | Rubens Camino Junior | rubenscamino@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:50:19 | NULL |
| 34166 | RUBENS GUIMAR�ES FILHO | rbguima@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:39 | NULL |
| 34167 | Rubens Martins Bastos | rubensmartinsbastos@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:39 | NULL |
| 19176 | RUI BUENO DE OLIVEIRA | ruioliveira1963@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:50:38 | NULL |
| 19178 | RUY ALFREDO ANTONINI | mrantonini@live.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:51:13 | NULL |
| 34177 | S�RGIO MONTEIRO LIMA J�NIOR | limajrsm@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:44 | NULL |
| 23270 | Sabrina Santos de Souza Lião | sabri_bmf@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:51:41 | NULL |
| 34169 | Sam�rio Cintra Maranh�o | maxifacce2018@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:40 | NULL |
| 34168 | SAMARA CAROLINE FERNANDES GALVANI | samaracfg@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:40 | NULL |
| 34170 | Samia Azmi Ibrahim Muhammad Ahmad Destro | drasamiaahmad@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:40 | NULL |
| 34171 | Samuel Macedo Costa | samuel.macedo.costa@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:40 | NULL |
| 19180 | SANDRA DE CSSIA SANTANA SARDINHA | drasandrasardinha@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:51:57 | NULL |
| 34172 | Sandra Regina Guimar�es | sanreguimaraes@uol.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:41 | NULL |
| 19181 | SANDRA REGINA MIRANDA | srta.reginamiranda@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:52:12 | NULL |
| 34173 | SANDRO BARROS MARTINS | Martinsbarrossandro@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:41 | NULL |
| 34174 | SANDRO BELMINO LUCAS TORRES | sandro_lucas@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:41 | NULL |
| 19182 | Sandro Isaas Santana | sandro@alisodonto.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:52:28 | NULL |
| 23291 | Sandro Melo de Oliveira | sm.oliveiraa19@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:52:42 | NULL |
| 34175 | SAULO ELLERY SANTOS | sauloellery@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:42 | NULL |
| 34176 | Saulo L�bo Chateaubriand do Nascimento | saulo.chateaubriand@ufpe.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:42 | NULL |
| 23099 | Saulo Pires Teixeira | drsaulopires@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:52:57 | NULL |
| 19185 | SÉRGIO ANTONIO SCHIEFFERDECKER | schiefferdecker@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:53:17 | NULL |
| 16980 | SERGIO BRAGA MAIA | sergiobragamaia@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:53:31 | NULL |
| 19186 | Sergio Correia de Melo Junior | dr_scmjunior@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:54:00 | NULL |
| 19260 | Sergio Eduardo Migliorini | smigliorini@terra.com.br | 5511999313407 | JBCOMS | 1 | months | active | 2025-12-17 20:54:15 | NULL |
| 19187 | Sergio Honorio | serghonorio@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:54:31 | NULL |
| 19189 | SÉRGIO LUIS DE MIRANDA | sergio@cirurgiadaface.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:54:50 | NULL |
| 34178 | Silmara Elena Papa Pellizoni | silmarapapa@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:44 | NULL |
| 34179 | Silvia Provasi | silvia.provasi@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:44 | NULL |
| 19194 | SILVIO MAURO GALLON | silvio@arteeface.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 17:46:56 | NULL |
| 34180 | Sormani Bento Fernandes de Queiroz | dr.sormaniqueiroz@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:45 | NULL |
| 34181 | SYDNEY DE CASTRO ALVES MANDARINO | sydneymandarino@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:45 | NULL |
| 9971 | Sylvio Luiz Costa de Moraes | sdmoraes@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:26:45 | NULL |
| 34198 | T�LIO DEL CONTE VALCANAIA | valcanaia.dt@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:52 | NULL |
| 34183 | T�nia Furtado | taniaa.f@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:46 | NULL |
| 34184 | T�rik Ocon Braga Polo | tarikpolo@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:46 | NULL |
| 19197 | Taise Simonetti | taise_simonetti@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:55:40 | NULL |
| 34182 | TALITA LOPES | tali_odonto@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:45 | NULL |
| 15744 | Talvane sobreira | talvane@talvanesobreira.com | 5583999812860 | JBCOMS | 1 | months | active | 2025-12-17 17:51:53 | NULL |
| 19199 | TÂNIA MARIA PEREIRA ISOLAN | isolan@terra.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 17:52:37 | NULL |
| 19200 | TARIZA GALLICCHIO MOREIRA | tarizabuco@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:55:51 | NULL |
| 19201 | TATIANA PACHECO MURCIA | tatimurcia@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:56:03 | NULL |
| 34185 | TATIANA RAMIRES BARONE | tatiana.barone@ibirapuera.edu.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:47 | NULL |
| 19202 | TATIANE FONSECA FARO | tatianefonsecafaro@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:14:16 | NULL |
| 34186 | Tayane Heidy De Oliveira | tayaneheidy@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:47 | NULL |
| 34187 | Tha�s da Silveira Rodrigues | thaissilveira@ufg.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:47 | NULL |
| 34188 | Thais Sydulovicz | syduloviczthais@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:48 | NULL |
| 23073 | THAIZ CARRERA ARRABAL | thaizarrabal@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:23:36 | NULL |
| 23120 | Thales Botome Cousen | thalescousen@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:33:51 | NULL |
| 34189 | Thalita Goulart Rodrigues | dra.thalitagoulart@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:48 | NULL |
| 23109 | Thalita Guarda Fagoni | thalitaguarda@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:32:43 | NULL |
| 19207 | Thalles Moreira Suassuna | thallesms_@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:25:14 | NULL |
| 19206 | Thas Graciolli Savian | thaissavian@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 14:23:20 | NULL |
| 7957 | Thiago Aragon Zanella | thiago_zanella@hotmail.com | 5527998568567 | JBCOMS | 1 | months | active | 2025-12-17 20:56:17 | NULL |
| 34190 | Thiago da Silva Torres | thiago.s.torres@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:49 | NULL |
| 34191 | Thiago de Oliveira Freitas | thi.oliveiraf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:49 | NULL |
| 15319 | Thiago Freire Lima | thiagofreirelima@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:24:15 | NULL |
| 19208 | THIAGO GALLICCHIO MOREIRA | gallicchiotgm@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:24:00 | NULL |
| 34192 | Thiago Jos� Domingues de Andrade | tjandrade1@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:50 | NULL |
| 34193 | Thiago Martins Magalh�es Ramos | tmmramos@msn.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:50 | NULL |
| 34194 | THIAGO RODRIGUES DE AGUIAR | thiagoraguiarcbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:51 | NULL |
| 19209 | Thiago Salvador de Lima Yamada | thiago.yamada@alumni.usp.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:56:54 | NULL |
| 34195 | THIAGO SOUSA ALMADA | tsalmada@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:51 | NULL |
| 34196 | Thomas Galves Cavalheiro | thomasgalves_@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:51 | NULL |
| 34197 | Thompson Sousa Freire | thompsonsfreire@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:51 | NULL |
| 23103 | Tiburtino José de Lima Neto | tiburtinoneto@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:05:09 | NULL |
| 23050 | TITO LÚCIO FERNANDES | titoluciofernandes@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:05:27 | NULL |
| 34199 | VALERIA CAMPAGNOLO | valeriacampagnolo97@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:52 | NULL |
| 34200 | VALFRIDO ANT�NIO PEREIRA FILHO | dinho@foar.unesp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:52 | NULL |
| 19215 | Vanderle de Arlete Orso | vanderlepoa@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:11:14 | NULL |
| 34201 | Vanessa Cador Batu | vanessacador9@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:53 | NULL |
| 2541 | Vanessa Castro | vacastro@uol.com.br | 5571999037579 | JBCOMS | 1 | months | active | 2025-12-17 17:53:56 | NULL |
| 34202 | Vanessa Cristina de Branco Gon�alves | vcdebranco@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:53 | NULL |
| 34203 | Vanessa Cristina Rafalovich | vanessarafalovich@usp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:53 | NULL |
| 19217 | Victor Duarte Ranauro | victoranauro@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:57:09 | NULL |
| 23235 | Victor Eric Nóbrega de Oliveira | victorericno@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:15:07 | NULL |
| 34204 | VILDEMAN RODRIGUES DE ALMEIDA JUNIOR | vildemanrodrigues@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:54 | NULL |
| 19221 | Vilson Rocha Cortez Teles de Alencar | vilsonctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:57:27 | NULL |
| 19222 | Vinicius Azeredo Mller | vini_azemuller@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:57:43 | NULL |
| 34205 | Vinicius Costa Teixeira | vinyt36@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:54 | NULL |
| 19223 | Vinicius Fernandes Cavalcante | viniciusfc.ctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:58:00 | NULL |
| 19224 | Vinicius Kleinubing Rhoden | vrhodenctbmf@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:13:03 | NULL |
| 34206 | Vinicius Luiz Conte Santos | drviniciusconte@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:55 | NULL |
| 19225 | Vinicius Nery Viegas | vnviegas@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:10:28 | NULL |
| 23297 | Vitória Ellen Andrade Barbosa | viviviellen@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:08:38 | NULL |
| 34207 | VIVIANI CARNEIRO MOTA | vivianicmota@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:56 | NULL |
| 34208 | WAGNER MARQUES | wmcirurgia@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:56 | NULL |
| 34209 | WAGNER MONTEIRO DE ALMEIDA | wma1983@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:56 | NULL |
| 34210 | Wagner Rodrigues Massa | wagner109@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:56 | NULL |
| 19231 | WALDEMAR MASSAHIRO TANAKA | waldemarmassahiro.tanaka@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:24:28 | NULL |
| 19232 | WALDNER RICARDO SOUZA DE CARVALHO | RICARDOBUCOMAXILO@GMAIL.COM |  | JBCOMS | 1 | months | active | 2025-12-17 20:15:25 | NULL |
| 19234 | Walter Leal de Moura | walterlealdemoura@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:58:17 | NULL |
| 23095 | WANDERLEY DA SILVA FÉLIX JUNIOR | wfelixjunior@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:23:05 | NULL |
| 19236 | Warley Carvalho de Sousa | warleyok@yahoo.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 14:22:27 | NULL |
| 34211 | Welington Martins Vieira | wwmartins42@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:58 | NULL |
| 34212 | WELSON ROCHA VIEIRA | welsonrv@unicamp.br |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:58 | NULL |
| 23231 | WESLLEY ROSAS RIBEIRO FERREIRA | weslley.c2r@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 17:41:45 | NULL |
| 34213 | WICTOR NOGUEIRA RODRIGUES | wictornogueira@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:58 | NULL |
| 23197 | William Harvey Machado de Sousa Lacerda Oliveira | williammachado369@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:58:33 | NULL |
| 19239 | William Phillip Pereira da Silva | william_phillip@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:58:46 | NULL |
| 23304 | Willian Gabriell de Matos Araujo Moraes | willgabriell@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:59:01 | NULL |
| 19241 | Willy Rodrigues Neuburger | willynew@outlook.com |  | JBCOMS | 1 | months | active | 2025-12-17 20:59:18 | NULL |
| 19242 | WILSON FERREIRA DE ASSIS | assis-wilson@bol.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:59:33 | NULL |
| 34214 | WILTON COSTA NETO | wiltoncostaneto@hotmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:59 | NULL |
| 34215 | Wilton Magalh�es da Silva Junior | wiltondutra82@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:31:59 | NULL |
| 19243 | WLADIMIR GENOVESI | wladimir.genovesi@h9j.com.br |  | JBCOMS | 1 | months | active | 2025-12-17 20:59:50 | NULL |
| 34216 | Yann Phillipp Esnaty Bizarro Gomes | cirurgia.ypg@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:32:00 | NULL |
| 34217 | Yuri Freires Braga | yuribraga361@gmail.com |  | JBCOMS | 1 | months | active | 2025-12-16 13:32:00 | NULL |
| 8959 | ADILSON LUIZ RAMOS | alramos@uem.br | 554432225337 | Livro - 13º Congresso Abor | 0 | months | active | 2022-06-14 12:47:35 | NULL |
| 8829 | KAROLINA PARRY AMORIM SILVA | karolparry@hotmail.com | 5584994300101 | Livro - 13º Congresso Abor | 0 | months | active | 2022-06-13 13:29:13 | NULL |
| 8977 | LUCAS ESTEVES | lucascirurgia@gmail.com | 5571982477874 | Livro - 13º Congresso Abor | 0 | months | active | 2022-06-14 18:52:39 | NULL |
| 8933 | MÁRIO BRUNO MENEZES | drmariobruno@hotmail.com | 5548988040215 | Livro - 13º Congresso Abor | 0 | months | active | 2022-06-13 19:50:53 | NULL |
| 9944 | Braulio caro norabuena | braucn@gmail.com | 51961777927 | Plano Anual Dental GO - R$ 780,00 | 78000 | months | active | 2025-05-29 17:02:16 | NULL |
| 32197 | Caio Kendi Ishikawa | caiokendi@hotmail.com | 55 44984535187 | plano anual teste | 1200 | months | active | 2026-01-22 11:50:34 | NULL |
| 1382 | Nilssy Perez | nilssy.perez@gmail.com | 18296910306 | Plano Dental GO Anual - R$780,00 | 78000 | months | active | 2021-10-07 02:15:21 | NULL |
| 22419 | ACYR HELVÉCIO DE MELLO | dracyrhm@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 14:35:52 | NULL |
| 19924 | ADRIANA MARIA FINOTTI FERNANDES | adrianafinotti@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-05 14:36:25 | NULL |
| 19926 | ADRIANA SGOLO TEIXEIRA VASCONCELOS | adristvasconcelos@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 17:12:59 | NULL |
| 22420 | ADRIANA SICUPIRA PEREGRINO BRAGA SALES | dricaspbraga@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 17:11:31 | NULL |
| 19927 | ADRIANA VILELA NOVAIS | dricanovaisodonto@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 17:13:27 | NULL |
| 19928 | ADRIENNE COELHO LACERDA | dra.adrienne@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 17:17:30 | NULL |
| 19940 | ALINE CASTRO VIEIRA BUSCH | acvbusch1@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-05 17:17:49 | NULL |
| 19942 | ALINE SIMES GUZZI DE ALMEIDA | asguzzi@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 17:18:54 | NULL |
| 19944 | ALLYSON HENRIQUE DE ANDRADE FONSECA | allysonhaf1@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-05 17:19:15 | NULL |
| 22429 | AMANDA CARLA MEDEIROS DUARTE | amandacarlamedeirosduarte@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 17:19:35 | NULL |
| 22430 | AMANDA PASCHOAL JORNADA | dramandapaschoal@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 17:19:56 | NULL |
| 19946 | ANA BARBARA MENDES DE ALMEIDA COPPINI | barbaracoppini@hotmail.com |  | SBTI | 1 | months | active | 2026-01-05 17:26:01 | NULL |
| 19947 | ANA CAROLINA BORBA | anacarol.borba@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 17:26:20 | NULL |
| 19952 | ANA CRISTINA FERNANDES MARIA FERREIRA | anacristina.ferreira@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 17:27:53 | NULL |
| 19957 | ANA PAULA COSTA IODO | draanapaula6@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-05 17:28:27 | NULL |
| 19961 | ANA TEREZA DE CASTRO FARIA | anatereza-20.12@hotmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:14:00 | NULL |
| 19960 | ANAPAULA SOUZA MOREIRA STAGLIANO | moreirastagliano2017@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:13:31 | NULL |
| 19962 | ANDERSON PEREIRA DO AMARAL | handerpa@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:33:30 | NULL |
| 19970 | ANDRÉ LUÍS SOARES GUIMARÃES | guimaraes-al@uol.com.br |  | SBTI | 1 | months | active | 2026-01-05 20:35:21 | NULL |
| 19964 | ANDRÉA DA SILVA MELLO CESAR RIANI COSTA | andreacriani@hotmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:34:38 | NULL |
| 19963 | ANDREA DAMAS TEDESCO | consultorio@andreatedesco.com.br |  | SBTI | 1 | months | active | 2026-01-05 20:34:16 | NULL |
| 19967 | ANDREA SERIO DIAS BRITTO | andreabritto2013@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:35:01 | NULL |
| 15120 | Andressa Ballarin | ballarin3d@gmail.com | 5548999720717 | SBTI | 1 | months | active | 2026-01-05 20:35:42 | NULL |
| 19972 | ANDREZZA TEIXEIRA | andrezzateixeiraqueiroz@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:36:03 | NULL |
| 19973 | ANDRIELLE RAMALHO DE MOURA SILVA | andrielle.ramalho@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:36:20 | NULL |
| 22431 | ANGELICA FERREIRA FERRAZ | dra@angelicaferraz.com |  | SBTI | 1 | months | active | 2026-01-05 20:36:49 | NULL |
| 19976 | ANNE AUGUSTA ROCHA SIMOES | anne.arsimoes@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:38:32 | NULL |
| 19978 | ARIADNE BERRIEL VALLIM | ariadnevallim@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:38:52 | NULL |
| 19984 | BELMIRO CAVALCANTI DO EGITO VASCONCELOS | belmiro.vasconcelos@upe.br |  | SBTI | 1 | months | active | 2026-01-05 20:40:11 | NULL |
| 19985 | BERENICE GOBBI | berenicegobbi@hotmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:40:46 | NULL |
| 19986 | BERNADETE APARECIDA TAVARES CUNHA | bernadetecunha13@gmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:41:21 | NULL |
| 19987 | BIANCA ROSATTI DE CAMPOS AZEVEDO | dra.biancacampos@outlook.com |  | SBTI | 1 | months | active | 2026-01-05 20:41:49 | NULL |
| 19988 | BRENO JOSÉ RIBEIRO DE OLIVEIRA PIRES RAPOSO | brenoraposo@hotmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:42:08 | NULL |
| 22432 | BRUNA ALVES FERREIRA | brunaaf27@hotmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:42:27 | NULL |
| 19990 | BRUNA THAS BONFIM DE ALMEIDA | bruu_ba@hotmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:49:21 | NULL |
| 22433 | BRUNA UGULINO MORAIS MARTINS | brunaugulino@hotmail.com |  | SBTI | 1 | months | active | 2026-01-05 20:49:45 | NULL |
| 19994 | CAMILA OLIVEIRA TEIXEIRA DE FREITAS | camila.otf@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:09:05 | NULL |
| 19998 | CARLA FERNANDA PECORARO RODRIGUES DIAS | carla@cpecoraro.com.br |  | SBTI | 1 | months | active | 2026-01-06 11:20:00 | NULL |
| 22434 | CARLA HERNANDES | cphernandes75@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:20:27 | NULL |
| 20002 | CARLOS MATEUS RIBEIRO SANCHES | carlos.m.r.sanches@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:20:48 | NULL |
| 20005 | CAROLINE LORENZONI SARAN | clsaran@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:21:11 | NULL |
| 20006 | CAROLINE MARRY DE ALMEIDA FIALHO | dra.carolinemarry@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:21:26 | NULL |
| 20007 | CATIA REGINA DE PAZ SILVEIRA | crpsilveira3@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:21:48 | NULL |
| 20012 | CHRISTIANE ESPÍNOLA BANDEIRA DE MELLO | chrisbeltrao@uol.com.br |  | SBTI | 1 | months | active | 2026-01-06 11:22:36 | NULL |
| 20013 | CHRYSTIANE FREIRE | chrysfreire@icloud.com |  | SBTI | 1 | months | active | 2026-01-06 11:22:54 | NULL |
| 20015 | CLAUDIA CENY LIMA FACCIOLI | claudia.faccioli@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:23:17 | NULL |
| 20016 | CLAUDIA MÁRCIA CARVALHO BASTOS | cbastos@pobox.com |  | SBTI | 1 | months | active | 2026-01-06 11:23:45 | NULL |
| 22436 | CLEDSON LIMA DE AZEVEDO | cledson@belezaesorriso.com.br |  | SBTI | 1 | months | active | 2026-01-06 11:24:51 | NULL |
| 20009 | CLIA MARISA RIZZATTI BARBOSA | rizzatti@unicamp.br |  | SBTI | 1 | months | active | 2026-01-06 11:22:17 | NULL |
| 20022 | CRISTIANA TENGAN | cristengan@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:25:09 | NULL |
| 20023 | CRISTIANE APARECIDA BONON TOMAZINHO | crisbonon@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:25:31 | NULL |
| 20025 | CRISTIANE BUHRER PEREIRA | crisbuhrer@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:25:50 | NULL |
| 20027 | CRISTIANE MARIA FAGUNDES MURICY | cris@muricy.net |  | SBTI | 1 | months | active | 2026-01-06 11:26:09 | NULL |
| 20034 | DANIELA BERNARDES CASTELLO BRANCO | daniela.bernardes@terra.com.br |  | SBTI | 1 | months | active | 2026-01-06 11:26:32 | NULL |
| 20035 | DANIELA BRAGATO | danibragato@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-06 11:26:54 | NULL |
| 20036 | DANIELA CRISTINA ROSARIO ALVES | danivip@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:27:13 | NULL |
| 22444 | DANIELA REGINA FACCIO REBELATTO | danifacciorebelatto@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:27:28 | NULL |
| 20037 | DANIELA RODRIGUES VALENTIM | danirodriguesvalentim@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:27:50 | NULL |
| 22445 | DANIELA VIEIRA AMANTEA | dvamantea1974@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:28:12 | NULL |
| 20038 | DANIELE FERREIRA BONACIN | danibonacin@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:28:36 | NULL |
| 20040 | DANIELE VILELA DE MELO BARROS | dvmbarros@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:29:01 | NULL |
| 20041 | DANIELLA CRISTINA BOVARETO CAVENAGUE | daniella.cavenague@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:29:17 | NULL |
| 20045 | DÉBORA FIGUEIREDO MARTINS | deborafmartinss@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:29:35 | NULL |
| 22446 | DENISE MARIA KARPEN | denisemkarpen@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:29:57 | NULL |
| 20047 | DERLANO BENTES CAPUCHO | dcapucho@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:30:19 | NULL |
| 22448 | EDUARDA MUNIZ DE MACEDO | dudamunizmacedo@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:31:48 | NULL |
| 20054 | ELAINE TUBINI REIS | elainetubini10@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:32:09 | NULL |
| 20055 | ELISABETE TERESA ZANUTO MATTAR | bethyblue1@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:32:41 | NULL |
| 20058 | ELYNE RAYANE GURJÃO AQUINO SILVA PINHEIRO | elynerayane@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:33:17 | NULL |
| 20060 | ERIKA KOYAMA VICTORASSO | erikakoyama1@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:33:35 | NULL |
| 20065 | EVERARDO ALVARENGA COSTA | everardocosta@terra.com.br |  | SBTI | 1 | months | active | 2026-01-06 11:34:01 | NULL |
| 20068 | FÁBIO BIANCO | fabianco@uol.com.br |  | SBTI | 1 | months | active | 2026-01-06 11:34:24 | NULL |
| 20072 | FATIMA AKL | fatima.akl@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:34:44 | NULL |
| 20073 | FÁTIMA RONEIVA ALVES FONSECA | fatimaroneiva.alvesfonseca@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:35:05 | NULL |
| 20075 | FERNANDA DE OLIVEIRA BRITO | fe19brito@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:36:33 | NULL |
| 20076 | FERNANDA FOGOLIN TEIXEIRA | ferfteixeira@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:36:54 | NULL |
| 22449 | FLAVIA KARINA GUIMARÃES SANDOVAL | flaviakg@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:37:13 | NULL |
| 20083 | FLAVIA MARIA DESIE | flaviadesie@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:37:30 | NULL |
| 20085 | FLÁVIO DE CARVALHO LUPOSELI | flavio@luposeli.com.br |  | SBTI | 1 | months | active | 2026-01-06 11:37:59 | NULL |
| 20395 | FLAVIO IMAMURA | flavio_imamura@uol.com.br |  | SBTI | 1 | months | active | 2026-01-06 11:38:21 | NULL |
| 20087 | GABRIELA ARAÚJO DE OLIVEIRA | consultoriodragabrielaaraujo@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:38:50 | NULL |
| 20090 | GABRIELA RIBEIRO BRASIL | gabiodonto06@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:52:03 | NULL |
| 20096 | GIOVANI HENRIQUE NUNES RONDON | cd_rondon@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:52:21 | NULL |
| 20101 | GLRIA ALBANI LARRAMBEBERE HUBER | ghuber@terra.com.br |  | SBTI | 1 | months | active | 2026-01-06 11:52:40 | NULL |
| 22451 | GRAZIELLA MARCELLI | gramarcelli@terra.com.br |  | SBTI | 1 | months | active | 2026-01-06 11:56:06 | NULL |
| 22452 | GUILHERME LUIZ BILOTTI GALHOTE | guilhermegalhote@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:56:24 | NULL |
| 20394 | GUSTAVO BATISTA GROLLI KLEIN | gustavobgklein@icloud.com |  | SBTI | 1 | months | active | 2026-01-06 11:56:44 | NULL |
| 1276 | HELSIE DE VILHENA EID | clinicadrahelsie@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:57:14 | NULL |
| 20108 | HERMANO BEZERRA DA SILVA | hermanobezerra7@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:57:31 | NULL |
| 20109 | HERMES PRETEL | hpretel@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:57:48 | NULL |
| 20115 | ISABELA SHIMIZU | isashimizu@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:58:11 | NULL |
| 22454 | ISABELLE MORAIS DE ARAÚJO | isabelle.morais@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:58:29 | NULL |
| 20121 | ISMENIA MALTA MONTE OLIVA | ismeniagm@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:58:50 | NULL |
| 20128 | JAQUELINE ZANELLA CASTELAN | jzcastelan@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:59:22 | NULL |
| 22455 | JEAN SERGIO DA SILVA | jeanssilva@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 11:59:48 | NULL |
| 22456 | JOÃO BATISTA DE MACEDO SOBRINHO | macedoj@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:00:19 | NULL |
| 20136 | JOO VICTOR PESSOA DA SILVA LINS | joaovictorpessoa@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:00:33 | NULL |
| 20138 | JOSÉ PEIXOTO FERRAO JUNIOR | ferrao.msi@terra.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:00:57 | NULL |
| 5957 | JOSE RIBAMAR SABINO BEZERRA JUNIOR | jrsbsabino@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:01:15 | NULL |
| 15964 | José Ricardo De Albergaria Barbosa | r.albergaria@yahoo.com | 55 1123679601 | SBTI | 1 | months | active | 2026-01-06 12:01:39 | NULL |
| 20143 | JULIANA MINHO JORDAN | juliana.minho@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:02:35 | NULL |
| 20144 | JULIANA NEVES HERINGER | junevesh@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:02:57 | NULL |
| 20146 | JULIANO DA SILVA BUSSELI | jubuspr@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:03:26 | NULL |
| 20147 | JULIANO DO VALLE | verificar@verificar.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:03:49 | NULL |
| 20152 | JÚLIO MARCO MAINENTI ROSALEM | jmarcomr@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:04:07 | NULL |
| 20153 | JULLIANA TRINDADE PINTAS | drapintas@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:04:26 | NULL |
| 20154 | KAMILLE BARBOSA PONTAROLLI | kpontarolli@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:04:48 | NULL |
| 20157 | KARINA M P FERRÃO DE AZEVEDO | karinaferrao01@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:05:06 | NULL |
| 20159 | KARLA MAGALHES ALVES | drakarlamagalhaes@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:05:28 | NULL |
| 22457 | KAROLINI VESCOVI CONTI | drakaroliniconti@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:05:52 | NULL |
| 20163 | KATYA RODRIGUES KOHLEMANN | katyakohlemann@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:06:19 | NULL |
| 20166 | KENYA DE MELO LÓPEZ | kenyademelo@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:06:39 | NULL |
| 22458 | KÉREN MARESSA ALVES GONÇALVES | kerenmaressa.ag@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:06:57 | NULL |
| 15614 | Laianny Kelly | lkellysb2@hotmail.com | 55 89994109621 | SBTI | 1 | months | active | 2026-01-06 12:07:14 | NULL |
| 20174 | LARISSA HOLLERWEGER | lari.holler@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:07:34 | NULL |
| 20175 | LAURA FILGUEIRAS MOHANA PINHEIRO | lauramohana@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:07:53 | NULL |
| 20180 | LEANDRO SILVA DA CONCEIO | drleandrosc@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:10:21 | NULL |
| 20181 | LETICIA BOOS | leticiaboos@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:10:41 | NULL |
| 20182 | LIDIA C HENNINGER | lidiaorthorj10@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:11:16 | NULL |
| 20186 | LINDINEIDE DE JESUS BEZERRA | lindineidebezerra@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:11:39 | NULL |
| 20188 | LÍVIA MARIA SIMÕES E SOUZA MORAES ZAMARIOLLI | liviazamariolli@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:12:14 | NULL |
| 20189 | LÍVIA MOREIRA LACERDA | liviamlacerda@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:12:38 | NULL |
| 15592 | LORENNA   DURANTE | 3d@durante.com.br | 55 21999966842 | SBTI | 1 | months | active | 2026-01-06 12:12:59 | NULL |
| 20196 | LUCAS DE SOUZA KUSSANO | esteticaoral.clinicakussano@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:13:21 | NULL |
| 20199 | LUCIANA DE OLIVEIRA RESENDE MACHADO | lu_oresende@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:14:36 | NULL |
| 20202 | LUCIANA PIMENTA E SILVA | lupimentta@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:15:04 | NULL |
| 20204 | LUCIANE BARBOSA DA SILVA HERNANDES | dralucianehernandes@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:15:39 | NULL |
| 20210 | LYCIA GARDENIA DOS SANTOS OLIVEIRA | lycia_gso@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:16:29 | NULL |
| 22466 | MARCEL QUEIROZ SOUZA FILHO | drmarcelqueiroz@icloud.com |  | SBTI | 1 | months | active | 2026-01-06 12:17:33 | NULL |
| 20215 | MARCELA JUNQUEIRA BERNARDES | marcelajbernardes@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:16:49 | NULL |
| 7938 | Marcelo Barbosa Ramos | odonto.mbramos@gmail.com | 5595981038116 | SBTI | 1 | months | active | 2026-01-06 12:17:13 | NULL |
| 20218 | MÁRCIA MARIA GONÇALVES DA ROCHA LIMA | marciamaria.lima@outlook.com |  | SBTI | 1 | months | active | 2026-01-06 12:18:03 | NULL |
| 20219 | MARCIA VALÉRIA GUALBERTO BARBOSA DE QUEIROZ | marciavaleriaqueiroz@uol.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:18:26 | NULL |
| 20221 | MARCO ANTONIO BRAITE | mabraite@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:21:02 | NULL |
| 22467 | MARCOS ANDRÉ MATOS DE OLIVEIRA | drmarcosandre@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:21:32 | NULL |
| 20223 | MARCOS PEREIRA REIS E CASTRO | dr.marcoscastro@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:22:16 | NULL |
| 20229 | MARIA DO PERPÉTUO SOCORRO SAMPAIO SOARES | perpetuasampaio@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:22:34 | NULL |
| 22470 | MARIA FERNANDA LEAO | mfernanda@clinicaident.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:22:56 | NULL |
| 20232 | MARIA GEOVANIA FERREIRA | mariageovaniaferreira@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:23:14 | NULL |
| 20234 | MARIA INES DE GODOY PEREIRA | migodoypereira@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:26:41 | NULL |
| 20241 | MARIA NAZARE CASTELO BRANCO LINS VERAS | nazarelinsestetica@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:27:04 | NULL |
| 20242 | MARIA P B M NAPOLEÃO | maria.pbmnapoleao@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:27:25 | NULL |
| 20246 | MARIELLE RIBEIRO DE CASTILHO | dramarielle.ribeiro@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:27:49 | NULL |
| 20249 | MARÍLIA MARIA QUEIROZ FLEURY TEIXEIRA | mqfleury@terra.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:28:15 | NULL |
| 20250 | MARILZA VIANNA MOURA | marilzavianna@uol.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:28:34 | NULL |
| 20252 | MARLI DE CARVALHO DINIZ PICON | dramarlidiniz@terra.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:28:57 | NULL |
| 20255 | MAYLE REIS MONTARGIL MEIRELLES | maylemeirelles@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:29:51 | NULL |
| 22471 | MAYRA EMÍLIA ARAÚJO DE SOUZA | mayraemilia09@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:30:14 | NULL |
| 20256 | MELINI SALGADO DE ALMEIDA SCHAFER | dra.melini@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:32:10 | NULL |
| 20257 | MELISSA SENEDIN | melissasenedin@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:32:35 | NULL |
| 20259 | MICHELLE DE PAULA ROSSI CARNEIRO | micherossi@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:32:54 | NULL |
| 20260 | MICHELLE MIQUELETI | m.miqueleti@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:33:57 | NULL |
| 20269 | MÔNICA DE VASCONCELOS NEVES ALVES AUGUSTO | mnevesaugusto@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:34:17 | NULL |
| 20270 | NABILA TABET MIGUEL DE ARAUJO PEREIRA | nabilatabet87@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:34:36 | NULL |
| 20272 | NARIMA ZOPONE | nazopone@yahoo.com |  | SBTI | 1 | months | active | 2026-01-06 12:34:57 | NULL |
| 22472 | NATANAEL BARBOSA DA SILVA NETO | natanael.neto@foufal.ufal.br |  | SBTI | 1 | months | active | 2026-01-06 12:37:53 | NULL |
| 20275 | NATHALIA CAROLINE DE SOUZA LIMA | nathalia-cs-lima@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:38:13 | NULL |
| 20281 | PALMIRA GUIMARES | palmiraguimaraes@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:39:26 | NULL |
| 20284 | PATRICIA FIGUEIREDO DA FONTE | patriciafigueiredofonte@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:40:42 | NULL |
| 20285 | PATRICIA GUEDES MACIEL VIEIRA | patgmv@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:41:48 | NULL |
| 20287 | PAULA CARVALHO VASCONCELOS | carvalhopaula2016@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:42:12 | NULL |
| 20291 | PAULO SÉRGIO GOMES DA SILVA | pauloss4@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:43:57 | NULL |
| 20295 | PRICILLA DE SOUZA RODRIGUES HUFFERNBAECHER | pricillasrh@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:44:28 | NULL |
| 22493 | RAFAEL CORVELONI | rcorveloni@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:45:17 | NULL |
| 20299 | RAFAELA MAIOLO GARMES | dra.rafaelagarmes@icloud.com |  | SBTI | 1 | months | active | 2026-01-06 12:44:50 | NULL |
| 22495 | RAFAELLA MARIA ALVES FERREIRA | rmaf@academico.ufpb.br |  | SBTI | 1 | months | active | 2026-01-06 12:45:36 | NULL |
| 20300 | RAFAELLA VIEIRA CAMPOS MESTIERI | rafaella.vieirad@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:45:54 | NULL |
| 20304 | RAQUEL CYRILLO DE SIQUEIRA | raquelcyrillosiqueira@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:46:38 | NULL |
| 20305 | REGIANE MENES ARES | regianemares1965@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:46:57 | NULL |
| 20306 | REGINA STELA MILLANI | rsmillani@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:47:15 | NULL |
| 15623 | renata bandeira lages | renatablages@gmail.com | 55 86999381009 | SBTI | 1 | months | active | 2026-01-06 12:47:35 | NULL |
| 20313 | RENATA SALERNO RE | renatasalerno@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:47:56 | NULL |
| 20317 | RENATO MEIRA DE CASTRO | renato@cobbotucatu.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:48:15 | NULL |
| 20318 | RENATO ROSSI JUNIOR | rossijr@terra.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:48:32 | NULL |
| 20322 | RICARDO TERUO MORISHITA | ricardo4370@terra.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:48:53 | NULL |
| 20335 | ROSA MARIA MERLOS SILVA | rmerlos59@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:49:40 | NULL |
| 20336 | ROSEMARY DE OLIVEIRA DAOLIO MIYAKE | rose.miyake123@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:56:23 | NULL |
| 22496 | ROSEMARY FROTA MAGALHÃES | rosemaryfmagalhaes@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:57:02 | NULL |
| 22497 | ROSSANA ABUD CABRERA ROSA | clinicadrarossanacabrera@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:57:20 | NULL |
| 20337 | ROUZE A. T. NOVAS | rouze@uol.com.br |  | SBTI | 1 | months | active | 2026-01-06 12:58:45 | NULL |
| 20339 | SANDRA DENISE FACHINI SEDREZ | sandrasedrez@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 12:59:03 | NULL |
| 20343 | SARA DE AZEVEDO RIZERIO TAVARES | sara.rizerio@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:06:04 | NULL |
| 20346 | SILVANA VILELA DE SOUZA MACHADO | silvana.vsm@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:07:25 | NULL |
| 20347 | SILVIA GISELE VIEIRA DONATO | silviagisele.vd@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:07:46 | NULL |
| 20350 | SOLANGE RENATA DA SILVA MADRUGA | solangersilma@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-06 13:08:11 | NULL |
| 700 | SUMAYA TAKAN BORDALO | takansumaya@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:08:30 | NULL |
| 20357 | TÂNIA MARA MAIA DE SIQUEIRA | taniammsiqueira@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:09:17 | NULL |
| 20359 | TÂNIA MÁRIS DE PAIVA | tanpai@uol.com.br |  | SBTI | 1 | months | active | 2026-01-06 13:09:41 | NULL |
| 22499 | TARLEY PESSOA DE BARROS | tpbarros@uol.com.br |  | SBTI | 1 | months | active | 2026-01-06 13:10:06 | NULL |
| 20361 | TATHIANA GAMA DE LUCA | tathianagama@uol.com.br |  | SBTI | 1 | months | active | 2026-01-06 13:10:40 | NULL |
| 20363 | TEREZA CRISTINA MARANHAO | maranhaoodonto@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:11:15 | NULL |
| 22501 | THAYS BATISTA TURCZINSKI | tturczinskiufpb@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:12:22 | NULL |
| 20369 | TIBIRIÇA BERTI RODRIGUES | tibiksk@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:13:22 | NULL |
| 20370 | VALDIR DE OLIVEIRA | vdoclinica@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:13:46 | NULL |
| 22502 | VALÉRIA DA COSTA MARTINELLO RODRIGUES | valeriamartinellojo@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:55:37 | NULL |
| 20373 | VALRIA RODRIGUES LEITO TORREZANI | valerialeitaotorrezani@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:55:58 | NULL |
| 708 | VANESSA ALVES DE OLIVEIRA BISOGNIN | dravanessa12@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:56:18 | NULL |
| 20375 | VANESSA DE PAULA SILVA | vanessaa.paula96@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:56:36 | NULL |
| 20377 | VANESSA MORTARI THIESEN WIESER | vanessathiesen@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:56:52 | NULL |
| 20379 | VANESSA SOUZA FREITAS | vsfreitasceo@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:57:07 | NULL |
| 22503 | VERA LÚCIA GAGO PERA | verapera@uol.com.br |  | SBTI | 1 | months | active | 2026-01-06 13:57:24 | NULL |
| 22504 | VIVIANE DE AZEVEDO RABELO | vivianerabelo@me.com |  | SBTI | 1 | months | active | 2026-01-06 13:57:41 | NULL |
| 20386 | VIVIANE MAIA DE CARVALHO PORTUGAL | vi_carvalho@hotmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:57:58 | NULL |
| 20389 | WAGNER DE MOURA JOSÉ | dottwagner.adv@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:58:34 | NULL |
| 20390 | WANIA PONTES BRANCO | waninhaptbr@yahoo.com.br |  | SBTI | 1 | months | active | 2026-01-06 13:58:58 | NULL |
| 20391 | WERNELDO ERWINO HORBE JR | militardr.horbe@gmail.com |  | SBTI | 1 | months | active | 2026-01-06 13:59:23 | NULL |
| 18708 | CLÁUDIO ROBERTO PACHECO JODAS | cjodas@yahoo.com.br |  | SBTI e JBCOMS | 1 | months | active | 2026-01-06 11:24:14 | NULL |
| 22447 | DHEINYFER JESSICA VALERETTO RISSATO | dheinyferjessica@gmail.com |  | SBTI e JBCOMS | 1 | months | active | 2026-01-06 11:30:40 | NULL |
| 18878 | Janaina Santos Badin Carvas | janainacarvas@hotmail.com |  | SBTI e JBCOMS | 1 | months | active | 2025-12-16 18:03:33 | NULL |
| 19190 | SERGIO LUIZ MELO GONCALVES | sergiogoncalves@predialnet.com.br |  | SBTI e JBCOMS | 1 | months | active | 2026-01-06 13:06:25 | NULL |
| 7960 | THALITA PEREIRA QUEIROZ | thaqueiroz@hotmail.com |  | SBTI e JBCOMS | 1 | months | active | 2026-01-06 13:11:56 | NULL |
| 20342 | SANDRA REGINA FERNANDES ALBUQUERQUE | srfalbuquerque@gmail.com |  | SBTI e SOBRAPI | 1 | months | active | 2026-01-06 12:59:40 | NULL |
| 10825 | Dentalgo Scholar | dentalgoscholar@gmail.com |  | Scholar | 1 | months | active | 2023-04-28 14:29:27 | NULL |
| 22601 | SCHOLAR TESTE2 | scholarteste2@gmail.com |  | Scholar | 1 | months | active | 2025-04-08 13:11:33 | NULL |
| 38552 | �ndria Carvalho Farias Torres | andria.carvalhoft@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:40 | NULL |
| 38602 | �ngelo Caetano Rodrigues Mathias Pereira | mathiasangelo4@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:58 | NULL |
| 38589 | Adriana Netto de Resende | dradriananetto@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:50 | NULL |
| 38497 | Adriana Oliveira Azevedo | adriana@cabiodontologia.com.br |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:24 | NULL |
| 38572 | Agatha Lemos Lima | agathalemoslima47@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:45 | NULL |
| 38590 | Agnys Catharine Leone Ferreira | agnysleone@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:50 | NULL |
| 38559 | Alberson do Carmo Mendon�a | albersoncm@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:42 | NULL |
| 38498 | Alessandra Cristina De Paula Silveira | alessandradipaula@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:25 | NULL |
| 38591 | Alessandra Cristina Porto dos Santos | santos.ale10@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:50 | NULL |
| 38516 | Alessandra Ferreira Figueredo | ale.jf.ferreira@hotmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:30 | NULL |
| 38592 | Alice Tiago Maciel | alicetmaciel987@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:51 | NULL |
| 38593 | Aline Freitas de Carvalho Cassaro | aline.afc@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:51 | NULL |
| 38594 | Allanis Gon�alves Rodrigues | dra.allanis@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:51 | NULL |
| 23512 | Allyne de Oliveira Souza | allynevdw@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 16:06:43 | NULL |
| 38595 | Amanda Castro Queiroz Cortez | amandac.odt@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:51 | NULL |
| 38510 | Amanda Christina Gomes Natividade | amandanatividade108@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:27 | NULL |
| 38477 | Amanda Chrystine Alves Rosa | amandarosaa61@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:19 | NULL |
| 38573 | Amanda da Fonseca Elias | amandafonelias@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:45 | NULL |
| 38454 | Amanda Guimar�es Cruz de Lima | amandaadnamaguimaraes@hotmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:12 | NULL |
| 38478 | Amanda Lucena Batista da Silva | lucenaamanda989@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:19 | NULL |
| 38479 | Amanda Pedrosa Magalh�es | amandapmodonto@outlook.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:19 | NULL |
| 38596 | Amanda Rezende de Souza | amandasouza10936@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:52 | NULL |
| 38597 | Amanda Sampaio dos Santos Freitas | assfamanda@hotmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:53 | NULL |
| 38598 | Ana Beatriz de Godoy Duarte | godoyanabia@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:53 | NULL |
| 38599 | Ana Carolina Bezerra da Silva | Anacbs2000@hotmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:54 | NULL |
| 21643 | Ana Carolina Correia Fontoura Loureiro | ana.fontoura12@hotmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 16:23:25 | NULL |
| 23621 | Ana Carolina Sobrinho Batista | draanacarolinasobrinho@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:53:19 | NULL |
| 18375 | Ana Carolina Vasconcelos Matos | carolzinha.vm21@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:52:56 | NULL |
| 18380 | Ana Caroline Soares Oliveira | draanacso@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:52:33 | NULL |
| 23523 | Ana Clara Marques de Azevedo | anaclaramarquesazevedo@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:52:10 | NULL |
| 38455 | Ana Clara Nobre Rodrigues de Brito | anaclaranobreodonto@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:12 | NULL |
| 17215 | Ana Clara Rodrigues Ribeiro | ana.rodrigues.ribeiro@hotmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:51:47 | NULL |
| 23518 | Ana Cristina dos Reis Abelha | anabelhac@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:51:25 | NULL |
| 38517 | Ana Gabriela Nunes Saldanha | dragabrielasaldanhaa@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:30 | NULL |
| 17216 | Ana Helena Pereira Loureno | anahelena.hpl96@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:51:01 | NULL |
| 38480 | Ana J�lia Oliveira Feitosa | anajuliaoliveira548@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:19 | NULL |
| 38600 | Ana Jessica da Silva Souza | dra.anajessicasm@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:56 | NULL |
| 17218 | Ana Julia Domiciano Baylao | anajuliadomiciano@hotmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:50:13 | NULL |
| 38601 | Ana Karolina Silva Pinheiro | aninhasilvapinheiro31@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:56 | NULL |
| 18393 | Ana Lara Tomas Pereira | analaratomas@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:49:24 | NULL |
| 38499 | Ana Leticia Gomes Martins | algmsn@hotmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:25 | NULL |
| 38456 | Ana Lu�sa Marques da Silva | anamrq.odonto@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:13 | NULL |
| 38481 | Ana Lu�za Castro Mendon�a | analui.castro@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:20 | NULL |
| 38551 | Ana Luiza da Silva Peres | analuizasilvaborges78@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:39 | NULL |
| 38518 | Ana Luiza Ribeiro Fracaro | analuizarfracaro@hotmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:30 | NULL |
| 38457 | Ana Natacha de Aguiar Carvalho | natachaaguiar201@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:13 | NULL |
| 38560 | Ana Paula Fortunato Silv�rio | dra.anapsilverio@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:42 | NULL |
| 21648 | Ana Paula Martins de Moura | odontomartinsbsb@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:49:01 | NULL |
| 23534 | Ana Paula Rolim Mendonça | anapaularolim30@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:02:02 | NULL |
| 38458 | Ana Qu�zia Alves Silva | anaqueziaalvessilva@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:13 | NULL |
| 18438 | Andr Fonseca Carvalho Ferreira | andrferreira11@outlook.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:02:29 | NULL |
| 38683 | Andr� Ferreira | ?andrferreira11@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 13:52:11 | NULL |
| 38586 | Andr�a Louise Arnold Vanni | andrea.vanni@tst.jus.br |  | Scholar Ária | 1 | months | active | 2026-03-13 13:50:49 | NULL |
| 17230 | Andrea Julieth gomez sanchez | Andreajuliethgomezsanchez@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:02:54 | NULL |
| 17232 | Andressa Cunha Assuno | andressa_cunha18@hotmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:03:18 | NULL |
| 23537 | Ane Christine Paes Salomão | anecpsalomao@gmail.com |  | Scholar Ária | 1 | months | active | 2026-03-13 15:03:42 | NULL |

_2000 registro(s)_

## 17. ASSINANTES CANCELADOS (amostra 100)

| id | fullName | email | phoneNumber | plano | status | canceledAt  1 |
| --- | --- | --- | --- | --- | --- | --- |
| 1586 | Fernando Manhaes | fernando@fmanhaes.odo.br | 5519981231500 | DentalGo Anual R$58,00 | canceled | 2026-06-25 14:57:52 |
| 5580 | Julyano Vieira da Costa | julyanovieira@gmail.com | 5544991265822 | DentalGo Anual R$ 68,00 | canceled | 2026-06-24 20:09:51 |
| 1470 | Murilo Augusto Anacleto | muriloanacleto@uol.com.br | 55 31999884360 | Dental GO Recorrente - R$ 89,00 | canceled | 2026-06-23 20:17:02 |
| 19716 | MARCO ANTONIO SATO | marcoasato@uol.com.br |  | DentalGo Anual R$58,00 | canceled | 2026-06-22 15:08:34 |
| 860 | Fausto Silva Bramante | faubramante@hotmail.com | 5514991169777 | DentalGo Anual R$58,00 | canceled | 2026-06-17 20:24:12 |
| 15045 | FERNANDA APARECIDA CAINELLI SANCHES | facsanches@hotmail.com | 1697925723 | Dental GO Anual R$78,00 | canceled | 2026-06-16 13:15:05 |
| 15045 | FERNANDA APARECIDA CAINELLI SANCHES | facsanches@hotmail.com | 1697925723 | DentalGo Anual R$58,00 | canceled | 2026-06-16 13:14:50 |
| 38159 | Iasmim da Fonseca Barros | ODONTOPEDIASMIM@GMAIL.COM |  | SLM - São Leopoldo Mandic | canceled | 2026-06-15 21:00:30 |
| 35429 | Livia Camargo Ortega | LIVIACORTEGA@GMAIL.COM |  | SLM - São Leopoldo Mandic | canceled | 2026-06-15 21:00:13 |
| 18141 | GIOVANA REMBOWSKI CASACCIA | giocasaccia@hotmail.com |  | Dental GO Anual R$78,00 | canceled | 2026-06-11 15:04:28 |
| 7184 | EGON JOSE BINSFELD | egonbinsfeld@hotmail.com | 5555999633876 | Dental GO Anual R$78,00 | canceled | 2026-06-09 13:23:07 |
| 7976 | Silvia de Morais Cavalcanti | s-cduarte@hotmail.com | 5581991377774 | DentalGO Cortesia | canceled | 2026-06-08 18:26:08 |
| 7662 | Juan Andree Uribe Ponce | uribeponcejuanandree@gmail.com | 55992781644 | DentalGO Cortesia | canceled | 2026-06-02 18:35:47 |
| 39157 | Margarete Pilar | margarete.bannuart@gmail.com |  | DentalGo Anual R$ 68,00 | canceled | 2026-05-29 20:12:34 |
| 39155 | DANLYNE EDUARDA ULISSES DE QUEIROGA | queirogadeu@gmail.com |  | Dental GO Anual R$78,00 | canceled | 2026-05-29 19:41:13 |
| 9192 | Alexandre da Silva Malhon | malhon@bol.com.br | 55 45999649016 | DentalGo Anual R$58,00 | canceled | 2026-05-28 12:19:56 |
| 22374 | Luiz Eduardo Monteiro Dias da Rocha | luizedurocha@gmail.com |  | SOBRAPI | canceled | 2026-05-15 12:31:07 |
| 10578 | Lais Christina Pontes Espindola | laisespindola@hotmail.com | +55 21979021541 | SOBRAPI | canceled | 2026-05-15 12:30:45 |
| 16495 | Mônica Galvão | odonto.monicagalvao@gmail.com |  | SOBRAPI | canceled | 2026-05-15 12:30:22 |
| 23773 | Josy Lorena Peres da Silva Vilarinho | josylorenaps@gmail.com |  | SOBRAPI | canceled | 2026-05-15 12:29:59 |
| 15904 | Danyelle Aparecida de Oliveira | danyelleaoliveira@outlook.com | 55 31998528556 | SOBRAPI | canceled | 2026-05-15 12:29:35 |
| 21889 | Sânia Cristine Ribeiro | saniaribeiro3@gmail.com |  | SOBRAPI | canceled | 2026-05-15 12:29:13 |
| 21273 | Halina Berejuk | halinaberejuk@gmail.com | 55  5516991169232 | SOBRAPI | canceled | 2026-05-15 12:28:50 |
| 34671 | Alexia Saad Lopes | ALEXIASLOPES@LIVE.COM |  | SLM - São Leopoldo Mandic | canceled | 2026-05-15 12:24:08 |
| 17846 | Adriano Monteiro Almeida Monteiro | amdmonteiro@yahoo.com.br |  | SOBRAPI | canceled | 2026-05-15 12:23:46 |
| 28742 | Luiz Eduardo Felizardo | luiz.felizardo@gmail.com |  | SLM - São Leopoldo Mandic | canceled | 2026-05-15 12:20:22 |
| 38995 | Frederico Damasio Soares | fdsoares48@gmail.com |  | SOBRAPI | canceled | 2026-05-15 12:20:00 |
| 23773 | Josy Lorena Peres da Silva Vilarinho | josylorenaps@gmail.com |  | Scholar Ária | canceled | 2026-05-15 12:17:54 |
| 20330 | ROGÉRIO DE LIMA ROMEIRO | rogerio.romeiro@terra.com.br |  | SLM Professores | canceled | 2026-05-13 20:14:20 |
| 7251 | Olegario antonio Teixeira neto | Olegariotneto@gmail.com | 55 62981673343 | SLM - São Leopoldo Mandic | canceled | 2026-05-13 20:12:12 |
| 23839 | Daniela Breda de Oliveira Rodrigues | dbreda.or@gmail.com |  | SOBRAPI | canceled | 2026-05-13 20:11:48 |
| 16271 | Natalia Rodrigues Manes | nataliamanes@gmail.com |  | SOBRAPI E JBCOMS | canceled | 2026-05-13 20:03:03 |
| 23845 | Erivan Clementino Gualberto Júnior | erivangualberto@ufam.edu.br |  | SOBRAPI | canceled | 2026-05-13 20:00:07 |
| 4505 | FABRICIO PINELLI VALARELLI | fabriciovalarelli@gmail.com | 5514991110001 | Cortesia Professores | canceled | 2026-05-08 16:50:38 |
| 5530 | tony vieira faria | tonyvf21@hotmail.com | 55 (27) 98182-8677 | DentalGo Anual R$58,00 | canceled | 2026-05-06 15:07:48 |
| 445 | Maura Regia Lima Verde Moura Lopes | mauraregialopes@gmail.com | 5586998000668 | DentalGo Anual R$58,00 | canceled | 2026-05-04 15:01:06 |
| 15174 | Luegya Knop | luegya@gmail.com | 5571986047302 | Dental GO Anual R$78,00 | canceled | 2026-05-04 13:17:35 |
| 38909 | T.I Teste | ti.teste@hotmail.com |  | DentalGo Anual R$ 68,00 | canceled | 2026-04-29 18:02:43 |
| 38909 | T.I Teste | ti.teste@hotmail.com |  | DentalGo Anual R$58,00 | canceled | 2026-04-29 11:10:12 |
| 38909 | T.I Teste | ti.teste@hotmail.com |  | DentalGo Anual R$ 68,00 | canceled | 2026-04-29 11:09:37 |
| 9624 | SILVIA RODRIGUES DO NASCIMENTO | silvianascimento1408@gmail.com | 5511996131960 | DentalGo Anual R$58,00 | canceled | 2026-04-27 22:30:43 |
| 6641 | Roberto Carvalho | simonettirsc@gmail.com | 551182410411 | SLM Professores | canceled | 2026-04-24 18:04:42 |
| 6551 | Alexandre Purcino Nogueira | alexandrepurcino@uol.com.br | 5511973352218 | DentalGo Anual R$ 58,00 + Revista Impressa | canceled | 2026-04-24 15:02:52 |
| 3600 | Luciana Carvalho  Goulart  Coelho | lugoulcoelho@hotmail.com | 5519992197176 | SLM - São Leopoldo Mandic | canceled | 2026-04-24 15:01:22 |
| 8240 | JOSE BORGES DE MOURA JUNIOR | jborgesodonto@gmail.com | 5586999875680 | DentalGo Anual R$ 68,00 | canceled | 2026-04-23 11:37:44 |
| 7222 | Peterson Pastorelli | petersonpastorelli@hotmail.com | 55 17997047644 | DentalGo Anual R$ 68,00 | canceled | 2026-04-22 20:36:30 |
| 3113 | Alan Regis de Novaes | alanr_odonto@yahoo.com | 5573991947347 | DentalGo Anual R$58,00 | canceled | 2026-04-22 20:36:07 |
| 7222 | Peterson Pastorelli | petersonpastorelli@hotmail.com | 55 17997047644 | DentalGo Anual R$ 68,00 | canceled | 2026-04-22 20:35:31 |
| 22781 | Pricila Pereira | pricilapereirapb@gmail.com |  | SOBRAPI | canceled | 2026-04-20 18:15:51 |
| 23837 | Juliana Portes de Oliveira | drajulianaportes@gmail.com |  | SOBRAPI | canceled | 2026-04-20 18:11:40 |
| 22909 | Jorge Luís Saade | jorgelsaade@uol.com.br |  | SOBRAPI | canceled | 2026-04-20 18:10:29 |
| 16645 | RENATO ARAÚJO RIBEIRO | rtto@ig.com.br |  | DentalGo Anual R$ 68,00 | canceled | 2026-04-10 13:26:02 |
| 22612 | Gustavo Vicentis de Oliveira Fernandes | gustfernandes@gmail.com |  | SOBRAPI E JBCOMS | canceled | 2026-04-09 18:58:04 |
| 38816 | Marcos Flaminio Carlos Júnior | marcao55@uol.com.br |  | SOBRAPI | canceled | 2026-04-09 15:07:20 |
| 16275 | Odvaldo Honor De Brito Filho | odvaldohonor@gmail.com |  | SOBRAPI | canceled | 2026-04-09 14:20:48 |
| 22612 | Gustavo Vicentis de Oliveira Fernandes | gustfernandes@gmail.com |  | SOBRAPI | canceled | 2026-04-09 14:17:51 |
| 22780 | Edson Dias da Silva | edydias@uol.com.br |  | SOBRAPI | canceled | 2026-04-09 14:17:29 |
| 22014 | Rosimara Ferreira de Souza Salomão | rosimara.ferreira@gmail.com |  | SLM - São Leopoldo Mandic | canceled | 2026-04-09 14:16:41 |
| 9617 | Geraldo Gil Faggioni Junior | marinas.faggioni@gmail.com | 5534999186848 | DentalGo Anual R$58,00 | canceled | 2026-04-06 18:42:46 |
| 908 | Fabio Mendes | frmendes@yahoo.com | 5594981158306 | DentalGo Anual R$58,00 | canceled | 2026-04-01 13:20:33 |
| 2316 | Michele Suppion | michele.ortodontia@gmail.com | 5511930048001 | DentalGo Anual R$ 68,00 | canceled | 2026-03-31 12:14:19 |
| 28715 | Luis Fernando de Castro Valle | luiscastrovalle@gmail.com |  | SLM - São Leopoldo Mandic | canceled | 2026-03-26 20:13:33 |
| 22613 | Andréia Pereira de Souza Pavani | andreia.xlvi@usp.br |  | SOBRAPI | canceled | 2026-03-26 20:10:18 |
| 17994 | Julo Cesar Joly | joly@implanteperio.com.br |  | SLM Professores | canceled | 2026-03-26 20:08:09 |
| 18035 | Maria Isabel Bastos Valente | belvalente@hotmail.com |  | SOBRAPI | canceled | 2026-03-26 19:16:30 |
| 6872 | Ivan Pedro Taffarel | ivan@ortodontiataffarel.com.br | 55984067179 | DentalGo Anual R$58,00 | canceled | 2026-03-25 12:45:27 |
| 38762 | Arisa okabayashi | arisaokabayashi@gmail.com.br | 5544999752609 | Cortesia Alunos Especializações | canceled | 2026-03-24 17:13:17 |
| 37914 | DELCIO RUIZ BARBOSA | delrbarbosa@hotmail.com | +55 67 999766113 | Cortesia Alunos Especializações | canceled | 2026-03-24 13:44:53 |
| 2894 | Marvio Martins Dias | ortomarvio11@gmail.com | 5598983060863 | DentalGo Anual R$ 68,00 | canceled | 2026-03-23 21:01:03 |
| 38257 | Luciene Ferreira Marinho Moreira | CICIMARINHO08@HOTMAIL.COM |  | SLM - São Leopoldo Mandic | canceled | 2026-03-23 19:49:25 |
| 27701 | José Viana Diniz | zevianadiniz@gmail.com |  | SLM - São Leopoldo Mandic | canceled | 2026-03-23 19:48:55 |
| 2316 | Michele Suppion | michele.ortodontia@gmail.com | 5511930048001 | DentalGo Anual R$ 68,00 | canceled | 2026-03-20 12:22:53 |
| 1287 | Jaqueline Gadben | jaquelineortoestetica@gmail.com | 5535988560197 | Dental GO Anual R$78,00 | canceled | 2026-03-19 19:37:26 |
| 16334 | Washington Macedo De Santana | wmsantana1@gmail.com |  | SOBRAPI | canceled | 2026-03-17 16:53:41 |
| 16334 | Washington Macedo De Santana | wmsantana1@gmail.com |  | SOBRAPI E JBCOMS | canceled | 2026-03-17 16:53:07 |
| 38685 | Simone Carvalho Junqueira Aradela | simonejp@terra.com.br | 55 31994222444 | SOBRAPI | canceled | 2026-03-17 16:52:15 |
| 30148 | Randle Palacio Pinheiro | randlepalacio@icloud.com |  | SLM - São Leopoldo Mandic | canceled | 2026-03-17 16:51:56 |
| 18066 | Rafael Paschoal Esteves Lima | rafaelpaschoalesteves@yahoo.com.br |  | SOBRAPI | canceled | 2026-03-17 16:51:36 |
| 22372 | Paula Chiattone Corvello | drapaulaclinicaattenta@gmail.com |  | SOBRAPI | canceled | 2026-03-17 16:51:16 |
| 5345 | Mauricio Araujo | odomar@hotmail.com |  | SLM Professores | canceled | 2026-03-17 16:40:35 |
| 33186 | Márcio Eduardo Vieira Falabella | marciofalabella@uai.com.br |  | SOBRAPI | canceled | 2026-03-17 16:40:01 |
| 10517 | Douglas Campideli Fonseca | douglas@unilavras.edu.br | 5535988176928 | SOBRAPI | canceled | 2026-03-17 16:38:48 |
| 16115 | Ana Lvia Fileto Mazzonetto | anafileto@hotmail.com |  | SOBRAPI | canceled | 2026-03-17 16:37:40 |
| 33181 | Amanda Beatriz Gonçalves Vivacqua | mandybvivacqua@gmail.com |  | SOBRAPI | canceled | 2026-03-17 16:37:03 |
| 2706 | Alexandre Zanesco | azanesco@gmail.com | 5511989291714 | DentalGo Anual R$58,00 | canceled | 2026-03-16 19:48:14 |
| 17677 | Yasmin Pereira de Alcntara Perptuo | yasmin_perpetuo@hotmail.com |  | Scholar Ária | canceled | 2026-03-13 16:52:43 |
| 23510 | Wilson Júnio Xavier de Sousa | wjsx2000@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:51:52 |
| 23807 | Wilmar Lins de Souza | linswilmar@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:51:27 |
| 23517 | Wanessa Pires Brito | wanessapbrito23@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:51:03 |
| 21846 | Vivian Maria Loureiro Romão de Sousa | vivianmarialoureiro@hotmail.com |  | Scholar Ária | canceled | 2026-03-13 16:50:39 |
| 23526 | Vívian de Barros Lima | vivianbarros797@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:50:10 |
| 21845 | Vitória Siqueira de Bessa | vitoriasiqueira2020@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:49:46 |
| 18428 | Vinicius Aguiar Lucena | viniciusaguiar2323@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:49:22 |
| 17662 | Vilson Mateus Lopes da Silva | Dr.vilsonmateus@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:48:57 |
| 17661 | Victoryan Regya Araujo Ribeiro dos Santos | victoryan.araujo@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:48:33 |
| 17655 | Victor Hugo Miranda | victorhgmiranda@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:48:09 |
| 17653 | Ulysses Bautista de Melo | ulyssesbmelo@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:47:18 |
| 17649 | Thiago Alexandre Ribeiro Dutra | dutra.thiago22@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:46:54 |
| 23542 | Thays Assis Souza | thaysttrindade@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:46:28 |
| 21840 | Thais Pereira dos Santos Machado | thaissantos.odonto@gmail.com |  | Scholar Ária | canceled | 2026-03-13 16:46:03 |

_100 registro(s)_

## 18. CADASTROS SEM SUB E SEM COMPRA (abandonados)

| id | fullName | email | phoneNumber | createdAt  1 |
| --- | --- | --- | --- | --- |
|  | Editar | Copiar | Remover | 39299 |
|  | Editar | Copiar | Remover | 39297 |
|  | Editar | Copiar | Remover | 39296 |
|  | Editar | Copiar | Remover | 39295 |
|  | Editar | Copiar | Remover | 39294 |
|  | Editar | Copiar | Remover | 39293 |
|  | Editar | Copiar | Remover | 39292 |
|  | Editar | Copiar | Remover | 39290 |
|  | Editar | Copiar | Remover | 39289 |
|  | Editar | Copiar | Remover | 39287 |
|  | Editar | Copiar | Remover | 39283 |
|  | Editar | Copiar | Remover | 39277 |
|  | Editar | Copiar | Remover | 39274 |
|  | Editar | Copiar | Remover | 39273 |
|  | Editar | Copiar | Remover | 39272 |
|  | Editar | Copiar | Remover | 39271 |
|  | Editar | Copiar | Remover | 39219 |
|  | Editar | Copiar | Remover | 39218 |
|  | Editar | Copiar | Remover | 39217 |
|  | Editar | Copiar | Remover | 39216 |
|  | Editar | Copiar | Remover | 39215 |
|  | Editar | Copiar | Remover | 39214 |
|  | Editar | Copiar | Remover | 39208 |
|  | Editar | Copiar | Remover | 39198 |
|  | Editar | Copiar | Remover | 39197 |
|  | Editar | Copiar | Remover | 39196 |
|  | Editar | Copiar | Remover | 39195 |
|  | Editar | Copiar | Remover | 39194 |
|  | Editar | Copiar | Remover | 39193 |
|  | Editar | Copiar | Remover | 39192 |
|  | Editar | Copiar | Remover | 39191 |
|  | Editar | Copiar | Remover | 39190 |
|  | Editar | Copiar | Remover | 39189 |
|  | Editar | Copiar | Remover | 39188 |
|  | Editar | Copiar | Remover | 39187 |
|  | Editar | Copiar | Remover | 39186 |
|  | Editar | Copiar | Remover | 39179 |
|  | Editar | Copiar | Remover | 39177 |
|  | Editar | Copiar | Remover | 39175 |
|  | Editar | Copiar | Remover | 39174 |
|  | Editar | Copiar | Remover | 39173 |
|  | Editar | Copiar | Remover | 39171 |
|  | Editar | Copiar | Remover | 39170 |
|  | Editar | Copiar | Remover | 39169 |
|  | Editar | Copiar | Remover | 39168 |
|  | Editar | Copiar | Remover | 39167 |
|  | Editar | Copiar | Remover | 39166 |
|  | Editar | Copiar | Remover | 39164 |
|  | Editar | Copiar | Remover | 39160 |
|  | Editar | Copiar | Remover | 39159 |
|  | Editar | Copiar | Remover | 39158 |
|  | Editar | Copiar | Remover | 39156 |
|  | Editar | Copiar | Remover | 39148 |
|  | Editar | Copiar | Remover | 39147 |
|  | Editar | Copiar | Remover | 39143 |
|  | Editar | Copiar | Remover | 39126 |
|  | Editar | Copiar | Remover | 39125 |
|  | Editar | Copiar | Remover | 39124 |
|  | Editar | Copiar | Remover | 39122 |
|  | Editar | Copiar | Remover | 39121 |
|  | Editar | Copiar | Remover | 39120 |
|  | Editar | Copiar | Remover | 39119 |
|  | Editar | Copiar | Remover | 39117 |
|  | Editar | Copiar | Remover | 39116 |
|  | Editar | Copiar | Remover | 39115 |
|  | Editar | Copiar | Remover | 39113 |
|  | Editar | Copiar | Remover | 39114 |
|  | Editar | Copiar | Remover | 39112 |
|  | Editar | Copiar | Remover | 39111 |
|  | Editar | Copiar | Remover | 39109 |
|  | Editar | Copiar | Remover | 39108 |
|  | Editar | Copiar | Remover | 39106 |
|  | Editar | Copiar | Remover | 39105 |
|  | Editar | Copiar | Remover | 39104 |
|  | Editar | Copiar | Remover | 39103 |
|  | Editar | Copiar | Remover | 39102 |
|  | Editar | Copiar | Remover | 39101 |
|  | Editar | Copiar | Remover | 39100 |
|  | Editar | Copiar | Remover | 39099 |
|  | Editar | Copiar | Remover | 39095 |
|  | Editar | Copiar | Remover | 39094 |
|  | Editar | Copiar | Remover | 39093 |
|  | Editar | Copiar | Remover | 39092 |
|  | Editar | Copiar | Remover | 39091 |
|  | Editar | Copiar | Remover | 39090 |
|  | Editar | Copiar | Remover | 39089 |
|  | Editar | Copiar | Remover | 39088 |
|  | Editar | Copiar | Remover | 39087 |
|  | Editar | Copiar | Remover | 39084 |
|  | Editar | Copiar | Remover | 39083 |
|  | Editar | Copiar | Remover | 39082 |
|  | Editar | Copiar | Remover | 39081 |
|  | Editar | Copiar | Remover | 39080 |
|  | Editar | Copiar | Remover | 39079 |
|  | Editar | Copiar | Remover | 39078 |
|  | Editar | Copiar | Remover | 38996 |
|  | Editar | Copiar | Remover | 38991 |
|  | Editar | Copiar | Remover | 38990 |
|  | Editar | Copiar | Remover | 38989 |
|  | Editar | Copiar | Remover | 38988 |
|  | Editar | Copiar | Remover | 38987 |
|  | Editar | Copiar | Remover | 38986 |
|  | Editar | Copiar | Remover | 38985 |
|  | Editar | Copiar | Remover | 38982 |
|  | Editar | Copiar | Remover | 38981 |
|  | Editar | Copiar | Remover | 38980 |
|  | Editar | Copiar | Remover | 38979 |
|  | Editar | Copiar | Remover | 38978 |
|  | Editar | Copiar | Remover | 38976 |
|  | Editar | Copiar | Remover | 38973 |
|  | Editar | Copiar | Remover | 38972 |
|  | Editar | Copiar | Remover | 38971 |
|  | Editar | Copiar | Remover | 38968 |
|  | Editar | Copiar | Remover | 38932 |
|  | Editar | Copiar | Remover | 38931 |
|  | Editar | Copiar | Remover | 38928 |
|  | Editar | Copiar | Remover | 38927 |
|  | Editar | Copiar | Remover | 38926 |
|  | Editar | Copiar | Remover | 38925 |
|  | Editar | Copiar | Remover | 38923 |
|  | Editar | Copiar | Remover | 38907 |
|  | Editar | Copiar | Remover | 38906 |
|  | Editar | Copiar | Remover | 38904 |
|  | Editar | Copiar | Remover | 38902 |
|  | Editar | Copiar | Remover | 38889 |
|  | Editar | Copiar | Remover | 38888 |
|  | Editar | Copiar | Remover | 38887 |
|  | Editar | Copiar | Remover | 38886 |
|  | Editar | Copiar | Remover | 38884 |
|  | Editar | Copiar | Remover | 38882 |
|  | Editar | Copiar | Remover | 38880 |
|  | Editar | Copiar | Remover | 38871 |
|  | Editar | Copiar | Remover | 38870 |
|  | Editar | Copiar | Remover | 38868 |
|  | Editar | Copiar | Remover | 38867 |
|  | Editar | Copiar | Remover | 38866 |
|  | Editar | Copiar | Remover | 38865 |
|  | Editar | Copiar | Remover | 38864 |
|  | Editar | Copiar | Remover | 38863 |
|  | Editar | Copiar | Remover | 38862 |
|  | Editar | Copiar | Remover | 38861 |
|  | Editar | Copiar | Remover | 38860 |
|  | Editar | Copiar | Remover | 38859 |
|  | Editar | Copiar | Remover | 38858 |
|  | Editar | Copiar | Remover | 38857 |
|  | Editar | Copiar | Remover | 38852 |
|  | Editar | Copiar | Remover | 38850 |
|  | Editar | Copiar | Remover | 38849 |
|  | Editar | Copiar | Remover | 38848 |
|  | Editar | Copiar | Remover | 38847 |
|  | Editar | Copiar | Remover | 38845 |
|  | Editar | Copiar | Remover | 38844 |
|  | Editar | Copiar | Remover | 38843 |
|  | Editar | Copiar | Remover | 38841 |
|  | Editar | Copiar | Remover | 38840 |
|  | Editar | Copiar | Remover | 38838 |
|  | Editar | Copiar | Remover | 38837 |
|  | Editar | Copiar | Remover | 38836 |
|  | Editar | Copiar | Remover | 38835 |
|  | Editar | Copiar | Remover | 38834 |
|  | Editar | Copiar | Remover | 38833 |
|  | Editar | Copiar | Remover | 38832 |
|  | Editar | Copiar | Remover | 38831 |
|  | Editar | Copiar | Remover | 38828 |
|  | Editar | Copiar | Remover | 38815 |
|  | Editar | Copiar | Remover | 38814 |
|  | Editar | Copiar | Remover | 38813 |
|  | Editar | Copiar | Remover | 38810 |
|  | Editar | Copiar | Remover | 38807 |
|  | Editar | Copiar | Remover | 38806 |
|  | Editar | Copiar | Remover | 38805 |
|  | Editar | Copiar | Remover | 38804 |
|  | Editar | Copiar | Remover | 38803 |
|  | Editar | Copiar | Remover | 38801 |
|  | Editar | Copiar | Remover | 38800 |
|  | Editar | Copiar | Remover | 38799 |
|  | Editar | Copiar | Remover | 38797 |
|  | Editar | Copiar | Remover | 38793 |
|  | Editar | Copiar | Remover | 38792 |
|  | Editar | Copiar | Remover | 38791 |
|  | Editar | Copiar | Remover | 38788 |
|  | Editar | Copiar | Remover | 38787 |
|  | Editar | Copiar | Remover | 38786 |
|  | Editar | Copiar | Remover | 38785 |
|  | Editar | Copiar | Remover | 38766 |
|  | Editar | Copiar | Remover | 38765 |
|  | Editar | Copiar | Remover | 38764 |
|  | Editar | Copiar | Remover | 38759 |
|  | Editar | Copiar | Remover | 38739 |
|  | Editar | Copiar | Remover | 38738 |
|  | Editar | Copiar | Remover | 38737 |
|  | Editar | Copiar | Remover | 38734 |
|  | Editar | Copiar | Remover | 38731 |
|  | Editar | Copiar | Remover | 38730 |
|  | Editar | Copiar | Remover | 38729 |
|  | Editar | Copiar | Remover | 38726 |
|  | Editar | Copiar | Remover | 38725 |
|  | Editar | Copiar | Remover | 38724 |
|  | Editar | Copiar | Remover | 38722 |
|  | Editar | Copiar | Remover | 38721 |

_200 registro(s)_
