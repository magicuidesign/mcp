export function createTextResponse(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload),
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
