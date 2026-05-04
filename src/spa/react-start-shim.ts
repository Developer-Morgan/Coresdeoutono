// SPA-build shim para @tanstack/react-start.
// Substitui o pacote durante o build da Vercel (modo SPA estático), onde
// não existe runtime de server functions. Mantém apenas a API mínima usada
// no client para que o bundle compile sem o plugin TanStack Start.

export const useServerFn = <T extends (...args: any[]) => any>(fn: T): T => fn;

export function createServerFn(_opts?: unknown): any {
  const builder: any = {
    middleware: () => builder,
    inputValidator: () => builder,
    handler: () => async () => {
      throw new Error("Server functions are disabled in this static SPA build.");
    },
  };
  return builder;
}

export function createMiddleware(_opts?: unknown): any {
  const mw: any = {
    client: () => mw,
    server: () => mw,
  };
  return mw;
}

export function createStart(_opts?: unknown): any {
  return { createMiddleware };
}
