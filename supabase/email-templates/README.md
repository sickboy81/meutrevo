# Templates de e-mail do Meu Trevo

No Supabase, abra **Authentication → Email Templates** e cole os arquivos nos respectivos campos:

- `confirmation.html` em **Confirm signup**
- `recovery.html` em **Reset password**
- `invite.html` em **Invite user**
- `email-change.html` em **Change email address**

Em **Authentication → URL Configuration**, use:

```text
Site URL: https://www.meutrevo.com
Redirect URLs: https://www.meutrevo.com/login, https://www.meutrevo.com/reset-password
```
