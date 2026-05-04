// SPA-build stub para src/server/admins.functions.ts.
// O painel de gerenciamento de admins requer service role e só funciona no
// build SSR (Lovable / Cloudflare). Neste build SPA estático, mostramos uma
// mensagem clara em vez de quebrar o bundle.

const unavailable = async () => {
  throw new Error(
    "Gerenciamento de administradores requer o build com SSR. Acesse pela versão publicada na Lovable."
  );
};

export const listAdmins = unavailable;
export const createAdmin = unavailable;
export const removeAdmin = unavailable;
export const resetAdminPassword = unavailable;
