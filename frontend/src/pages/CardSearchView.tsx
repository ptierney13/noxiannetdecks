import { useSearch } from "@tanstack/react-router";
import { CardSearchResultsPane } from "../features";

export default function CardSearchView() {
  const { q = "" } = useSearch({ from: "/cards" });

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 pb-8 pt-4">
      <CardSearchResultsPane query={q} />
    </div>
  );
}
