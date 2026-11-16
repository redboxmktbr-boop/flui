# FLUI

Sua mente tem seu ritmo.

Projeto novo e independente, sem código do repositório anterior. React + TypeScript + Vite, Supabase Auth/Postgres e PWA. Identidade visual alinhada ao manual e às referências fornecidas pelo usuário: logotipo original, Fluizinho 3D original, roxo profundo com amarelo no celular e lavanda clara no computador. Poppins hospedada no próprio aplicativo. A origem dos arquivos está documentada em `docs/identidade-visual.md`.

## Executar

1. Instale Node.js 22.12 ou superior (recomendado: Node.js 24 LTS).
2. Execute `npm ci`.
3. Esta versão já aponta para o projeto Supabase **Flui GPT** (`cedtmapgmtuhuzevqiwv`). A configuração em `src/supabase-config.ts` contém somente a URL e uma chave publicável de navegador; as regras RLS protegem os dados.
4. As duas migrações de `supabase/migrations/` já foram aplicadas nesse projeto. Não execute novamente os scripts nele.
5. Para usar outra instância, copie `.env.example` para `.env.local`, preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` e aplique as migrações em ordem no novo banco. Nunca use service_role ou chave secreta no frontend. A variável antiga `VITE_SUPABASE_ANON_KEY` ainda é aceita para compatibilidade.
6. No projeto Flui GPT, Site URL está em `http://127.0.0.1:5173`, com retornos permitidos para esse endereço e `http://localhost:5173`. Quando publicar, substitua Site URL pelo endereço HTTPS definitivo e adicione-o aos Redirect URLs. Configure SMTP antes de enviar e-mails de produção. A confirmação de e-mail está ativada.
7. Execute `npm run dev`.

A chave publicável fica visível no código e no aplicativo por definição; ela não é uma chave de administrador. Não há sessão fictícia, dados de exemplo ou fallback que simule persistência.

## Implementado no código

- Cadastro, login, sessão, logout e recuperação de senha com Supabase Auth.
- Dashboard com atalhos visuais, progresso circular e dados reais do usuário.
- Tela Evolução com seis pequenas conquistas calculadas dos registros atuais e gráfico interativo dos últimos sete dias. Sem pontuação fictícia ou histórico de conquistas permanente.
- Tarefas com criação, edição de título, prioridade e prazo, conclusão, exclusão, prioridade, prazo e um nível de subtarefas.
- Captura e exclusão de pensamentos, com conversão em tarefa mediante confirmação. Hábitos com calendário reversível dos últimos sete dias.
- Busca e filtros de tarefas; seleção de uma tarefa como contexto do temporizador. Essa seleção é local e não cria vínculo no histórico de sessões.
- Temporizador com pausa/retomada, horários absolutos para tolerar redução de frequência da aba e gravação explícita de sessões concluídas. Trocar de seção preserva o contador; recarregar ou fechar a página reinicia o contador. Não há alarme em segundo plano garantido.
- Modo sobrecarga com navegação pelo teclado e próximo passo priorizado.
- PWA instalável com cache apenas do aplicativo e fontes. As APIs do Supabase e os dados pessoais não são armazenados pelo service worker. Alterações exigem conexão; não há fila offline nesta fase.
- RLS em todas as tabelas, bloqueio de anônimos e referências compostas para impedir subtarefas/check-ins de outro usuário.

## Verificação

`npm test` executa testes unitários e de interação. `npm run build` verifica TypeScript e gera a versão de produção em `dist/`.

Os testes de UI usam respostas controladas para isolar o temporizador; isso não simula funcionalidades no aplicativo. Os testes em `tests/rls.test.ts` executam as políticas reais em PostgreSQL embarcado (PGlite), com duas contas e um visitante. `supabase/tests/rls_hosted.sql` também foi executado no projeto hospedado, usando uma transação revertida ao final para não deixar usuários ou registros de teste. Verificações HTTP confirmaram Auth ativo e bloqueio anônimo nas cinco tabelas. Entrega de e-mails, confirmação e recuperação ainda exigem uma conta com caixa postal real e URLs de retorno configuradas.

## Publicar

Qualquer hospedagem estática com HTTPS pode servir `dist/`. No Vercel use o preset Vite, build `npm run build` e saída `dist`. A configuração pública incluída já conecta o projeto Flui GPT; as variáveis de ambiente são opcionais para substituir a instância. O arquivo `vercel.json` define cabeçalhos básicos. A aplicação não usa rotas de servidor. Configurar as URLs de retorno de Auth antes de publicar. HTTPS é necessário para instalação e service worker fora de localhost.

## Próximas fases

1. Configurar o endereço de publicação e as URLs de Auth; validar confirmação de e-mail e recuperação com caixa postal real.
2. IA multimodelo em Edge Functions: JWT verificado, autorização pelo usuário, chaves apenas no servidor, limites de uso, timeout, consentimento explícito antes de enviar pensamentos e escolha/roteamento por tarefa. Nesta versão a área Assistente explica que a IA ainda não está conectada; não produz respostas simuladas.
3. Lembretes opt-in e fila offline com resolução de conflitos, após validar o núcleo.

Referência de segurança: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
