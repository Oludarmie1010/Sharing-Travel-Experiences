export default function SearchBar({ query, onChange, placeholder = "Search..." }) {
  return (
    <input
      className="input"
      type="text"
      placeholder={placeholder}
      value={query}
      onChange={e => onChange(e.target.value)}
      style={{ marginBottom: '1rem', width: '100%' }}
    />
  );
}
