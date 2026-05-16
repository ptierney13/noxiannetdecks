import { createContext, useContext, type ReactNode, useState } from "react";

interface ErrorContextValue {
  error: string | null;
  setError: (message: string | null) => void;
}

const ErrorContext = createContext<ErrorContextValue>({
  error: null,
  setError: () => {},
});

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  return <ErrorContext value={{ error, setError }}>{children}</ErrorContext>;
}

export function useAppError(): (message: string | null) => void {
  return useContext(ErrorContext).setError;
}

export function useAppErrorState(): string | null {
  return useContext(ErrorContext).error;
}
