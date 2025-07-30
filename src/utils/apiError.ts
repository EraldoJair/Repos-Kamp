export const handleApiError = (error: unknown, defaultMessage: string) => {
  let errorMessage = defaultMessage;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    errorMessage = (error as { message: string }).message;
  }
  console.error(defaultMessage + ':', error);
  return errorMessage;
};