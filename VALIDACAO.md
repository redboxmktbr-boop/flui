# Validação da primeira entrega

16 de novembro de 2026.

- `npm test`: 20 testes aprovados em quatro arquivos.
- `npm run build`: TypeScript e compilação de produção aprovados; geração do service worker aprovada.
- `npm audit`: nenhuma vulnerabilidade conhecida nas dependências instaladas.
- Identidade visual conferida no navegador em computador e em viewport de celular de 390 × 844: logotipo e mascotes originais extraídos do manual, com Poppins local.
- Navegação entre login, cadastro e recuperação conferida; controle de mostrar/ocultar senha conferido sem enviar credenciais.
- Migração executada em PostgreSQL embarcado com testes de isolamento entre dois usuários e visitante. Inclusão, consulta, alteração, exclusão, referências entre contas e check-in duplicado cobertos.

## Limites da verificação

Supabase conectado ao projeto **Flui GPT** (`cedtmapgmtuhuzevqiwv`). As cinco tabelas têm RLS e quatro políticas por tabela. Os testes de isolamento também passaram no banco hospedado; todas as contas e linhas de teste foram revertidas ao final. O endpoint Auth respondeu HTTP 200, com cadastro por e-mail e confirmação ativados. As cinco tabelas responderam HTTP 401 a consultas sem usuário autenticado. A revisão de segurança do Supabase não apontou avisos após restringir a execução pública da função de manutenção pré-existente.

Site URL e retornos de Auth configurados e conferidos no painel para `http://127.0.0.1:5173` e `http://localhost:5173`. Confirmação por e-mail, recuperação de senha e uso de uma sessão real no navegador ainda precisam de validação de ponta a ponta com caixa postal real. A instalação em Android/iOS e o comportamento offline em dispositivos reais também precisam de conferência. IA multimodelo, notificações e fila offline ainda não estão implementadas.

## Repositório

Código no novo repositório `https://github.com/redboxmktbr-boop/flui`. Inclui fontes, arquivos da PWA, migrações SQL, testes e workflow do GitHub Actions. A publicação e a configuração do endereço HTTPS definitivo de Auth ainda estão pendentes.
