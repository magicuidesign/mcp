export function createTextResponse(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function createErrorResponse(message: string, error?: unknown) {
  let errorMessage = message;

  if (error instanceof Error) {
    errorMessage += `: ${error.message}`;
  }

  return {
    content: [{ type: "text" as const, text: errorMessage }],
    isError: true,
  };
}
