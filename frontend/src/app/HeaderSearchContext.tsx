import { createContext, useContext, useState, type ReactNode } from "react";

type HeaderSearchContextType = {
  query: string;
  setQuery: (q: string) => void;
  appendQuery: (fragment: string) => void;
  headerSearchVisible: boolean;
  setHeaderSearchVisible: (visible: boolean) => void;
};

const HeaderSearchContext = createContext<HeaderSearchContextType>({
  query: "",
  setQuery: () => {},
  appendQuery: () => {},
  headerSearchVisible: true,
  setHeaderSearchVisible: () => {},
});

export function HeaderSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [headerSearchVisible, setHeaderSearchVisible] = useState(true);

  function appendQuery(fragment: string) {
    setQuery((prev) => (prev ? `${prev} ${fragment}` : fragment));
  }

  return (
    <HeaderSearchContext value={{ query, setQuery, appendQuery, headerSearchVisible, setHeaderSearchVisible }}>
      {children}
    </HeaderSearchContext>
  );
}

export function useHeaderSearch() {
  return useContext(HeaderSearchContext);
}
