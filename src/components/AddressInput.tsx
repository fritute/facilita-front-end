
import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

const debounce = <T extends (...args: any[]) => any>(func: T, delay: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

export interface Address {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressInputProps {
  onSelectAddress: (address: Address) => void;
  placeholder?: string;
}

const AddressInput: React.FC<AddressInputProps> = ({ onSelectAddress, placeholder = "Digite seu endereço..." }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchAddresses = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1`
      );
      const data: Address[] = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const debouncedFetch = debounce(fetchAddresses, 500);

  useEffect(() => {
    if (query) {
      debouncedFetch(query);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSelectSuggestion = (address: Address) => {
    setQuery(address.display_name);
    setShowSuggestions(false);
    onSelectAddress(address);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {suggestions.map((address) => (
            <li
              key={address.place_id}
              onClick={() => handleSelectSuggestion(address)}
              className="p-3 cursor-pointer hover:bg-gray-100"
            >
              {address.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressInput;