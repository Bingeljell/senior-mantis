const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("smDesktop", {
  getConfig: () => ipcRenderer.invoke("sm:get-config"),
  runReadonly: (action) => ipcRenderer.invoke("sm:run-readonly", action),
  getGatewayStatus: () => ipcRenderer.invoke("sm:gateway-status"),
  startGateway: () => ipcRenderer.invoke("sm:start-gateway"),
  stopGateway: () => ipcRenderer.invoke("sm:stop-gateway"),
  runSetup: () => ipcRenderer.invoke("sm:run-setup"),
  openDashboard: () => ipcRenderer.invoke("sm:open-dashboard"),
  runOnboarding: () => ipcRenderer.invoke("sm:run-onboarding"),
  runQuickAction: (input) => ipcRenderer.invoke("sm:run-quick-action", input),
});
