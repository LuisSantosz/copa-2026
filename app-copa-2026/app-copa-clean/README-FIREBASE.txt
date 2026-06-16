COMO ATIVAR O FIREBASE NO APP DA COPA

1. Acesse https://console.firebase.google.com
2. Crie um projeto ou use um existente.
3. No projeto, clique no ícone Web </> para criar um app Web.
4. Copie o objeto firebaseConfig.
5. Abra o arquivo firebase-config.js e cole os dados no lugar dos textos de exemplo.
6. No Firebase, vá em Build > Realtime Database > Criar banco de dados.
7. Para teste, use estas regras temporárias:

{
  "rules": {
    "copa2026": {
      ".read": true,
      ".write": true
    }
  }
}

IMPORTANTE: essas regras são abertas para teste. Para publicar de verdade, o ideal é usar autenticação ou restringir acesso.

O app salva em:
copa2026/app-principal

Você pode alterar esse caminho no arquivo firebase-config.js.
