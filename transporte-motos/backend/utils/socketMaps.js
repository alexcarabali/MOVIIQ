export const usuariosConectados = new Map();
export const conductoresConectados = new Map();
export const pendingResponseTimers = new Map();

export const DRIVER_RESPONSE_TIMEOUT_MS =
  Number(process.env.DRIVER_RESPONSE_TIMEOUT_MS) || 30000;
