import { createContext, useContext, useState, type ReactNode } from "react";

type HeaderSearchContextType = {
  query: string;
  setQuery: (q: string) => void;
  appendQuery: (fragment: string) => void;
};

const HeaderSearchContext = createContext<HeaderSearchContextType>({
  query: "",
  setQuery: () => {},
  appendQuery: () => {},
});

export function HeaderSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");

  function appendQuery(fragment: string) {
    setQuery((prev) => (prev ? `${prev} ${fragment}` : fragment));
  }

  return (
    <HeaderSearchContext value={{ query, setQuery, appendQuery }}>
      {children}
    </HeaderSearchContext>
  );
}

export function useHeaderSearch() {
  return useContext(HeaderSearchContext);
}
