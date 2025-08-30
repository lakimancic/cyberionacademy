import { FaSearch } from "react-icons/fa";
import "./SearchBar.css";
import { useEffect, useRef, useState } from "react";

type SearchTag = {
  name: string;
  label: string;
};

type Props = {
  label: string;
  setSearchWord?: (prev: React.SetStateAction<string>) => void;
  searchWord?: string;
  onSearch?: (tag?: string) => void;
  tags?: SearchTag[];
};

function SearchBar({ label, setSearchWord, onSearch, tags }: Props) {
  const [currentTag, setCurrentTag] = useState<SearchTag | null>(null);
  const [tagWidth, setTagWidth] = useState(0);
  const tagRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (tags && !currentTag) {
      for (let tag of tags) {
        const prefix = tag.name + ": ";
        if (value.startsWith(prefix)) {
          value = "";
          setCurrentTag(tag);
          break;
        }
      }
    }

    setInput(value);
  };

  useEffect(() => {
    setTagWidth(tagRef.current?.clientWidth ?? 0);
  }, [currentTag]);

  useEffect(() => {
    setSearchWord?.(input);
  }, [input]);

  return (
    <div className="search-bar-container">
      <input
        type="search"
        placeholder={`Search ${currentTag ? currentTag.label : label}`}
        value={input}
        onChange={handleChange}
        onKeyDown={(e) => {
          e.key === "Enter" && onSearch?.(currentTag?.name);

          e.key === "Backspace" &&
            currentTag &&
            input === "" &&
            setCurrentTag(null);
        }}
        style={{
          paddingLeft: `calc(1rem + ${tagWidth}px)`,
        }}
      />
      {currentTag && (
        <div className="search-tag" ref={tagRef}>
          {currentTag.name}
        </div>
      )}
      <FaSearch onClick={() => onSearch?.(currentTag?.name)} />
    </div>
  );
}

export default SearchBar;
