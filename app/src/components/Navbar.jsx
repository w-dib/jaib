import React from "react";
import { PlusCircle, Search } from "lucide-react";
import logo from "../assets/icon48.png";

function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 border-b border-gray-200">
      {/* Left section: Logo and App Name */}
      <div className="flex items-center space-x-2">
        <img src={logo} alt="Jaib Logo" className="h-8 w-8" />
        <span className="text-xl font-bold">Jaib</span>
      </div>

      {/* Middle section: Navigation Links */}
      <div className="flex space-x-6">
        <a href="#" className="flex flex-col items-center group">
          <span className="font-semibold">Saves</span>
          <span className="block w-full h-0.5 bg-orange-500 group-hover:bg-orange-600"></span>
        </a>
        <a href="#" className="font-semibold hover:text-orange-500">
          Favorites
        </a>
        <a href="#" className="font-semibold hover:text-orange-500">
          Archives
        </a>
      </div>

      {/* Right section: Icons */}
      <div className="flex items-center space-x-4">
        {/* Add URL Icon */}
        <button className="p-1 rounded-full hover:bg-gray-100">
          <PlusCircle size={24} />
        </button>
        {/* Search Icon */}
        <button className="p-1 rounded-full hover:bg-gray-100">
          <Search size={24} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
