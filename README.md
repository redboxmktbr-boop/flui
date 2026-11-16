# FLUI

Sua mente tem seu ritmo.

Projeto novo e independente, sem código do repositório anterior. React + TypeScript + Vite, Supabase Auth/Postgres e PWA. Cores #7562D9, #68B4FF, #A6F3D6 e #FFB07C; Poppins hospedada no próprio aplicativo; mascote cérebro em SVG.

## Executar

1. Instale Node.js 22.12 ou superior (recomendado: Node.js 24 LTS).
2. Execute `npm ci`.
3. Copie `.env.example` para `.env.local`.
4. Crie um **novo** projeto Supabase e aplique `supabase/migrations/202611160001_flui.sql` no SQL Editor.
5. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e chave pública/anon do novo projeto. Nunca use service_role ou chave secreta no frontend.
6. Em Supabase Auth → URL Configuration, defina Site URL e Redirect URLs para os endereços de desenvolvimento e produção. Configure SMTP antes de enviar e-mails de produção. Mantenha confirmação de e-mail ativada.
7. Execute `npm run dev`.

Sem configuração, o aplicativo apresenta uma tela explicativa. Não há sessão fictícia, dados de exemplo ou fallback que simule persistência.

## Implementado no código

- Cadastro, login, sessão, logout e recuperação de senha com Supabase Auth.
- Dashboard calculado a partir dos dados do usuário.
- Tarefas com criação, edição do título, conclusão, exclusão, prioridade, prazo e um nível de subtarefas.
- Captura e exclusão de pensamentos; hábitos com registro diário reversível.
- Temporizador com pausa/retomada, horários absolutos para tolerar redução de frequência da aba e gravação explícita de sessões concluídas. Trocar de seção preserva o contador; recarregar ou fechar a página reinicia o contador. Não há alarme em segundo plano garantido.
- Modo sobrecarga com navegação pelo teclado e próximo passo priorizado.
- PWA instalável com cache apenas do aplicativo e fontes. As APIs do Supabase e os dados pessoais não são armazenados pelo service worker. Alterações exigem conexão; não há fila offline nesta fase.
- RLS em todas as tabelas, bloqueio de anônimos e referências compostas para impedir subtarefas/check-ins de outro usuário.

## Verificação

`npm test` executa testes unitários e de interação. `npm run build` verifica TypeScript e gera a versão de produção em `dist/`.

Os testes de UI usam respostas controladas para isolar o temporizador; isso não simula funcionalidades no aplicativo. Os testes em `tests/rls.test.ts` executam a migração e as políticas reais em PostgreSQL embarcado (PGlite), com duas contas e um visitante. Apenas a infraestrutura Auth do Supabase é fornecida pelo teste. A autenticação por e-mail e o fluxo completo dependem de uma instância Supabase configurada e de entrega de e-mails. A passagem dos testes locais não equivale a uma validação em produção.

## Publicar

Qualquer hospedagem estática com HTTPS pode servir `dist/`. No Vercel use o preset Vite, build `npm run build`, saída `dist` e as duas variáveis públicas. O arquivo `vercel.json` define cabeçalhos básicos. A aplicação não usa rotas de servidor. Configurar as URLs de retorno de Auth antes de publicar. HTTPS é necessário para instalação e service worker fora de localhost.

## Próximas fases

1. Conectar Supabase, executar testes RLS e validar cadastro/recuperação com duas contas reais.
2. IA multimodelo em Edge Functions: JWT verificado, autorização pelo usuário, chaves apenas no servidor, limites de uso, timeout, consentimento explícito antes de enviar pensamentos e escolha/roteamento por tarefa. Nesta versão a área Assistente explica que a IA ainda não está conectada; não produz respostas simuladas.
3. Progresso de hábitos, edição de prioridade/prazo, lembretes opt-in e fila offline com resolução de conflitos, após validar o núcleo.

Referência de segurança: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
