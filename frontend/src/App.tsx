import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { ErrorProvider } from "./app/ErrorContext";
import { HeaderSearchProvider } from "./app/HeaderSearchContext";
import { router } from "./app/router";
import { queryClient } from "./data";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <HeaderSearchProvider>
          <RouterProvider router={router} />
        </HeaderSearchProvider>
      </ErrorProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
