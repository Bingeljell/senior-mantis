export type AdapterInvocationSource = "desktop" | "whatsapp" | "agent";

export type AdapterInvocation = {
  adapterId: string;
  action: string;
  args: Record<string, unknown>;
  requestId: string;
  invokedBy: AdapterInvocationSource;
};

export type AdapterArtifact = {
  type: "file" | "url" | "text";
  value: string;
  label?: string;
};

export type AdapterError = {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
};

export type AdapterResult = {
  ok: boolean;
  requestId: string;
  summary: string;
  data?: Record<string, unknown>;
  artifacts?: AdapterArtifact[];
  error?: AdapterError;
};
