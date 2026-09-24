let kernel, pending;
export function initKernel() {
  if (!pending) pending = (async () => {
    const browser = typeof process === 'undefined' || !process.versions?.node;
    const moduleUrl = browser ? '/builder/manifold.js' : 'manifold-3d';
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
