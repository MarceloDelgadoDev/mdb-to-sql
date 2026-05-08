# PRD — mdb-to-sql

> **Product Requirements Document**
> Versão: 1.0.0
> Data: 2026-05-07
> Autor: Marcelo Delgado
> Status: Draft

---

## 1. Visão Geral

### 1.1 Problema

Sistemas legados construídos com Microsoft Access armazenam dados em arquivos `.mdb`. Desenvolvedores que precisam migrar, auditar ou modernizar esses sistemas enfrentam dificuldades para extrair os dados de forma programática, especialmente em ambientes macOS e Linux onde o Access não está disponível. Além disso, muitos projetos de modernização exigem scripts SQL portáteis — não apenas bancos binários — para controle de versão, revisão de código e compatibilidade com múltiplos bancos de dados.

### 1.2 Solução

`mdb-to-sql` é um pacote npm que converte arquivos `.mdb` (Microsoft Access) para arquivos `.sql` (SQL dump portátil) diretamente via linha de comando, sem dependências de sistema operacional, sem instalação de drivers e sem necessidade do Microsoft Access instalado.

### 1.3 Proposta de Valor

- **Zero dependências de sistema** — funciona em macOS, Linux e Windows com Node.js puro
- **Uma linha de comando** — `npx mdb-to-sql ./banco.mdb` e está feito
- **Output SQL portátil** — scripts `.sql` compatíveis com MySQL, PostgreSQL e SQLite
- **Output visual claro** — feedback detalhado de tabelas, registros e colunas convertidos
- **Publicado no npm** — instalável globalmente ou via `npx` sem instalação prévia

---

## 2. Público-Alvo

| Perfil | Necessidade |
|---|---|
| Desenvolvedor back-end | Migrar dados de sistema legado Access para stack moderna com script versionável |
| DBA / DevOps | Gerar dumps SQL de arquivos `.mdb` em pipelines de CI/CD |
| Desenvolvedor freelancer | Extrair dados de clientes que usam Access em formato universalmente legível |
| Estudante / pesquisador | Acessar e importar datasets distribuídos em formato `.mdb` para qualquer SGBD |

---

## 3. Escopo

### 3.1 Dentro do Escopo (v1.0)

- Leitura de arquivos `.mdb` (Access 97–2003)
- Exportação de **todas as tabelas** automaticamente
- Geração do `.sql` no mesmo diretório do `.mdb` com o mesmo nome base
- Output SQL com instruções `CREATE TABLE` e `INSERT INTO` para cada tabela
- Output no terminal com: origem, destino, lista de tabelas, resumo final
- Suporte a tipos simples: texto, inteiro, float, booleano, data
- Dialeto SQL padrão: compatível com MySQL, PostgreSQL e SQLite simultaneamente
- Publicação no npm como pacote público
- Suporte a `npx` sem instalação global

### 3.2 Fora do Escopo (v1.0)

- Arquivos `.accdb` (Access 2007+)
- Seleção de tabelas específicas
- Destino customizável via segundo argumento
- Dialetos SQL específicos (ex.: `--dialect mysql`)
- Migração de queries, forms ou macros do Access
- Campos OLE / imagens embutidas
- Geração de índices, constraints ou foreign keys
- Interface gráfica (GUI)
- Suporte a outros formatos de saída (CSV, JSON, SQLite binário)

### 3.3 Candidatos para v2.0

- Suporte a `.accdb` via lib alternativa
- Flag `--output <caminho>` para destino customizável
- Flag `--tables <t1,t2>` para seleção de tabelas
- Flag `--dialect <mysql|postgres|sqlite>` para dialetos específicos
- Flag `--dry-run` para listar tabelas sem converter
- Flag `--no-create` para gerar apenas `INSERT INTO` (sem `CREATE TABLE`)
- Flag `--verbose` para log detalhado por linha
- Geração de índices e foreign keys

---

## 4. Requisitos Funcionais

### RF-01 — Comando CLI
O pacote deve expor um comando executável via `npx`:
```bash
npx mdb-to-sql <caminho-do-arquivo.mdb>
```

### RF-02 — Validação de entrada
- Verificar se o argumento foi fornecido; caso contrário, exibir uso correto e encerrar com código de erro
- Verificar se o arquivo existe no caminho informado
- Verificar se a extensão é `.mdb`
- Exibir mensagem de erro clara para cada caso

### RF-03 — Leitura do arquivo .mdb
- Abrir e parsear o arquivo `.mdb` usando `mdb-reader`
- Listar todas as tabelas disponíveis no arquivo
- Para cada tabela, ler todas as colunas e todos os registros

### RF-04 — Geração do arquivo .sql
- Criar o arquivo `.sql` no mesmo diretório do `.mdb`
- O nome do arquivo deve ser o mesmo, apenas com extensão trocada
- Exemplo: `brasilakre.mdb` → `brasilakre.sql`
- Se o arquivo `.sql` já existir, sobrescrevê-lo
- O arquivo deve ser codificado em UTF-8

### RF-05 — Estrutura do arquivo SQL gerado
O arquivo `.sql` deve seguir a seguinte estrutura:

```sql
-- Gerado por mdb-to-sql v1.0.0
-- Origem: /caminho/completo/arquivo.mdb
-- Data  : 2026-05-07T00:00:00.000Z

-- --------------------------------------------------------
-- Tabela: nome_tabela
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `nome_tabela` (
  `coluna1` TEXT,
  `coluna2` INTEGER,
  `coluna3` REAL
);

INSERT INTO `nome_tabela` (`coluna1`, `coluna2`, `coluna3`) VALUES
  ('valor1', 42, 3.14),
  ('valor2', 7, NULL);
```

- Cada tabela precedida por um comentário de cabeçalho
- `CREATE TABLE IF NOT EXISTS` para idempotência
- Nomes de tabelas e colunas entre backticks (compatível com MySQL e SQLite)
- Múltiplos `VALUES` agrupados em um único `INSERT INTO` por tabela (batch insert)
- Valores texto escapados corretamente (aspas simples, barras invertidas)
- Valores nulos representados como `NULL`
- Valores booleanos representados como `1` ou `0`
- Valores de data representados como string ISO 8601

### RF-06 — Mapeamento de tipos

| Tipo Access | Tipo SQL |
|---|---|
| Text / Memo | TEXT |
| Integer / Long Integer | INTEGER |
| Single / Double | REAL |
| Currency | REAL |
| Boolean / Yes-No | INTEGER (0 ou 1) |
| DateTime | TEXT (ISO 8601) |
| Byte | INTEGER |
| Null / undefined | NULL |

### RF-07 — Escape de valores no SQL
- Strings devem ter aspas simples internas escapadas: `'` → `''`
- Strings devem ter barras invertidas escapadas: `\` → `\\`
- Valores `null` ou `undefined` devem ser emitidos como `NULL` (sem aspas)
- Números devem ser emitidos sem aspas
- Booleanos devem ser emitidos como `1` ou `0` (sem aspas)

### RF-08 — Output no terminal

O terminal deve exibir, em ordem:

```
MDB → SQL Converter
──────────────────────────────────────────

Origem : /caminho/completo/arquivo.mdb
Destino: /caminho/completo/arquivo.sql

Tabelas encontradas: N

✔ "tabela1" — X registros, Y colunas
✔ "tabela2" — X registros, Y colunas

──────────────────────────────────────────
Concluído!
  Tabelas  : N convertidas
  Registros: X
  Tamanho  : XX.X KB
  Arquivo  : /caminho/completo/arquivo.sql
──────────────────────────────────────────
```

### RF-09 — Códigos de saída do processo
- `0` — conversão concluída com sucesso
- `1` — erro de argumento / arquivo não encontrado / extensão inválida
- `2` — erro durante a leitura do `.mdb`
- `3` — erro durante a escrita do `.sql`

---

## 5. Requisitos Não Funcionais

### RNF-01 — Compatibilidade
- Node.js >= 16
- macOS, Linux e Windows (WSL)
- Sem dependências de sistema (sem `mdb-tools`, sem drivers ODBC, sem Java)
- SQL gerado compatível com MySQL 5.7+, PostgreSQL 12+ e SQLite 3+

### RNF-02 — Performance
- Arquivos de até 50 MB devem converter em menos de 10 segundos em hardware comum
- Uso de batch inserts (múltiplos `VALUES` por `INSERT INTO`) para reduzir o tamanho do arquivo gerado
- Escrita do `.sql` via stream para evitar acúmulo de toda a string em memória

### RNF-03 — Dependências npm

Apenas dependências com manutenção ativa e licença permissiva:

| Pacote | Versão mínima | Finalidade | Licença |
|---|---|---|---|
| `mdb-reader` | ^2.0.0 | Leitura do .mdb | MIT |
| `chalk` | ^5.0.0 | Output colorido no terminal | MIT |

> **Nota:** Diferentemente do `mdb-to-sqlite`, este pacote **não utiliza** `better-sqlite3`. A saída é um arquivo de texto SQL puro, gerado via `fs.createWriteStream` nativo do Node.js.

### RNF-04 — Qualidade de código
- ESModules (`"type": "module"` no package.json)
- Sem TypeScript na v1 (manter simples para contribuidores)
- Tratamento de erros em todos os pontos críticos (try/catch)
- Sem dependências de desenvolvimento obrigatórias para o build

### RNF-05 — Publicação npm
- Nome do pacote: `mdb-to-sql`
- Acesso: público
- Tag padrão: `latest`
- `.npmignore` configurado para excluir arquivos desnecessários

---

## 6. Estrutura do Projeto

```
mdb-to-sql/
├── bin/
│   └── cli.js            # Entry point — parsing de args, orquestra o fluxo
├── src/
│   ├── reader.js         # Abre o .mdb e retorna tabelas/colunas/dados
│   ├── writer.js         # Cria o .sql via stream e escreve os statements
│   ├── converter.js      # Orquestra reader + writer, emite eventos de progresso
│   ├── typeMap.js        # Mapeamento de tipos Access → SQL
│   └── escape.js         # Funções de escape de valores para SQL seguro
├── .npmignore
├── .gitignore
├── package.json
├── README.md
└── PRD.md
```

---

## 7. Interface do CLI

### Uso correto
```bash
npx mdb-to-sql ./dados/brasilakre.mdb
```

### Erros esperados

```bash
# Sem argumento
$ npx mdb-to-sql
Uso: mdb-to-sql <caminho-do-arquivo.mdb>

# Arquivo não encontrado
$ npx mdb-to-sql ./nao-existe.mdb
Erro: Arquivo não encontrado: ./nao-existe.mdb

# Extensão errada
$ npx mdb-to-sql ./banco.accdb
Erro: Apenas arquivos .mdb são suportados na versão atual.
```

---

## 8. package.json — Campos Relevantes

```json
{
  "name": "mdb-to-sql",
  "version": "1.0.0",
  "description": "Converte arquivos .mdb (Microsoft Access) para .sql via linha de comando",
  "type": "module",
  "bin": {
    "mdb-to-sql": "./bin/cli.js"
  },
  "keywords": ["mdb", "sql", "access", "converter", "cli", "database", "migration", "dump"],
  "license": "MIT",
  "engines": {
    "node": ">=16"
  }
}
```

---

## 9. Critérios de Aceite (Definition of Done)

### CLI
- [ ] `npx mdb-to-sql ./arquivo.mdb` executa sem erros em macOS com Node 18+
- [ ] Output no terminal segue exatamente o formato definido no RF-08
- [ ] Erros exibem mensagens claras e encerram com o código correto (RF-09)

### Conversão
- [ ] Todas as tabelas do `.mdb` são representadas no `.sql` com `CREATE TABLE IF NOT EXISTS`
- [ ] Todos os registros são inseridos via `INSERT INTO` sem perda de dados
- [ ] Tipos de dados são mapeados corretamente conforme RF-06
- [ ] Valores de string são devidamente escapados conforme RF-07
- [ ] O arquivo `.sql` gerado pode ser importado com sucesso em MySQL, PostgreSQL e SQLite
- [ ] O arquivo `.sql` é válido e legível em qualquer editor de texto

### Publicação
- [ ] Pacote publicado em `https://www.npmjs.com/package/mdb-to-sql`
- [ ] `npx mdb-to-sql` funciona sem instalação global prévia
- [ ] README descreve instalação, uso, limitações conhecidas e exemplo de SQL gerado
- [ ] Versão inicial publicada como `1.0.0`

---

## 10. Plano de Publicação npm

### Pré-requisitos
1. Conta criada em [npmjs.com](https://www.npmjs.com)
2. Login via `npm login` no terminal
3. Nome `mdb-to-sql` disponível no registry

### Checklist de publicação
1. [ ] Testar localmente com `node bin/cli.js ./teste.mdb`
2. [ ] Validar o `.sql` gerado importando-o em SQLite: `sqlite3 teste.db < teste.sql`
3. [ ] Validar o `.sql` gerado importando-o em MySQL ou PostgreSQL
4. [ ] Testar instalação local com `npm pack` e validar o tarball
5. [ ] Testar `npx` apontando para o diretório local
6. [ ] Revisar `README.md` com exemplos reais e trecho do SQL gerado
7. [ ] Garantir que `.npmignore` está correto
8. [ ] `npm publish --access public`
9. [ ] Verificar a página em `npmjs.com/package/mdb-to-sql`

### Versionamento (SemVer)

| Tipo de mudança | Versão |
|---|---|
| Bug fix | patch: 1.0.x |
| Nova feature sem breaking change | minor: 1.x.0 |
| Breaking change | major: x.0.0 |

---

## 11. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| `mdb-reader` não suporta versão específica do .mdb | Média | Alto | Testar com arquivos reais; documentar limitação no README |
| Nome `mdb-to-sql` já ocupado no npm | Baixa | Médio | Verificar disponibilidade antes de iniciar; ter alternativas (`mdb2sql`, `mdb-sql-dump`) |
| SQL gerado inválido em dialeto específico (ex.: backticks no PostgreSQL) | Média | Médio | Testar importação nos três SGBDs alvo; documentar workarounds no README |
| Arquivos `.mdb` com encoding não-UTF8 | Média | Médio | `mdb-reader` lida com isso internamente; testar com dados reais do usuário |
| Strings com caracteres especiais quebram o SQL | Média | Alto | Implementar escape robusto em `escape.js`; cobrir casos com testes manuais |
| Tabelas muito grandes causam consumo excessivo de memória | Baixa | Médio | Usar stream para escrita; processar registros em chunks se necessário |

---

## 12. Diferenças em relação ao mdb-to-sqlite

| Aspecto | mdb-to-sqlite | mdb-to-sql |
|---|---|---|
| Formato de saída | Arquivo binário `.sqlite` | Arquivo texto `.sql` |
| Portabilidade | Requer cliente SQLite para usar | Importável em qualquer SGBD |
| Dependência extra | `better-sqlite3` | Nenhuma (Node.js nativo) |
| Controle de versão | Não diff-able (binário) | Diff-able (texto puro) |
| Revisão humana | Requer ferramenta gráfica | Legível em qualquer editor |
| Idempotência | Sobrescreve o arquivo | `CREATE TABLE IF NOT EXISTS` |
| Uso em CI/CD | Importação direta | Script versionável no repositório |

---

## 13. Referências

- [mdb-reader no npm](https://www.npmjs.com/package/mdb-reader)
- [chalk no npm](https://www.npmjs.com/package/chalk)
- [Documentação npm publish](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [SemVer](https://semver.org)
- [MySQL — LOAD DATA / importação SQL](https://dev.mysql.com/doc/refman/8.0/en/load-data.html)
- [PostgreSQL — psql import](https://www.postgresql.org/docs/current/app-psql.html)
- [SQLite — CLI import](https://www.sqlite.org/cli.html)