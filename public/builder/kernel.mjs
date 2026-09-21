let kernel, pending;
export function initKernel() {
  if (!pending) pending = (async () => {
    const browser = typeof window !== 'undefined';
    const moduleUrl = browser ? '/builder/manifold.js' : new URL('../../node_modules/manifold-3d/manifold.js', import.meta.url).href;
    const { default: Module } = await import(moduleUrl);
    kernel = await Module(browser ? { locateFile: () => '/builder/manifold.wasm' } : {});
    kernel.setup();
    return kernel;
  })().catch(error => { pending = null; throw error; });
  return pending;
}
export function getKernel() {
  if (!kernel) throw new Error('Geometry kernel has not initialized');
  return kernel;
}
