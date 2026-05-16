import { RouterProvider } from "@tanstack/react-router";
import { ErrorProvider } from "./app/ErrorContext";
import { HeaderSearchProvider } from "./app/HeaderSearchContext";
import { router } from "./app/router";

export default function App() {
  return (
    <ErrorProvider>
      <HeaderSearchProvider>
        <RouterProvider router={router} />
      </HeaderSearchProvider>
    </ErrorProvider>
  );
}
