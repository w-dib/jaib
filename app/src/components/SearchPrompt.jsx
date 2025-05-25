import React, { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button"; // Assuming you might want a search button, or it could be on-type search
import logo from "../assets/icon48.png";

function SearchPrompt({ isOpen, onClose, onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      // Decide if you want to close the prompt after search or keep it open with results
      // onClose();
    }
  };

  // Optional: Implement on-type search if desired
  // useEffect(() => {
  //   if (searchTerm.trim()) {
  //     const debounceSearch = setTimeout(() => {
  //       onSearch(searchTerm.trim());
  //     }, 500); // Debounce time
  //     return () => clearTimeout(debounceSearch);
  //   }
  // }, [searchTerm, onSearch]);

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center">
      {/* Top Bar with Logo and Close Button */}
      <div className="w-full flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Jaib Logo" className="h-8 w-8" />
          <span className="text-xl font-bold">Jaib</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close Search"
        >
          <X size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-grow flex flex-col items-center justify-center w-full max-w-xl px-4">
        <form
          onSubmit={handleSearchSubmit}
          className="w-full flex flex-col items-center"
        >
          <div className="relative w-full mb-4">
            <SearchIcon
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <Input
              type="search"
              placeholder="Search your Jaib..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-md shadow-sm"
              autoFocus
            />
          </div>
          {/* You might not need an explicit search button if you implement on-type search 
              or if pressing Enter in the input triggers search automatically. 
              For now, let's include it. */}
          <Button
            type="submit"
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-md text-lg transition-colors shadow-md"
            disabled={!searchTerm.trim()} // Disable button if search term is empty
          >
            Search
          </Button>
        </form>

        {/* Placeholder for search results if displayed directly in this prompt */}
        {/* <div className="mt-8 w-full"> */}
        {/*   { Render search results here } */}
        {/* </div> */}
      </div>
    </div>
  );
}

export default SearchPrompt;
