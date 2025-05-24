import React from "react";
import { PlusCircle, Search, LogOut } from "lucide-react";
import logo from "../assets/icon48.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";

function Navbar({ user, onSignOut }) {
  return (
    <nav className="sticky top-0 z-50 flex items-center px-6 py-3 border-b border-gray-200 bg-white">
      {/* Left section: Logo and App Name */}
      <div className="flex items-center space-x-2 w-1/4">
        <img src={logo} alt="Jaib Logo" className="h-8 w-8" />
        <span className="text-xl font-bold">Jaib</span>
      </div>

      {/* Middle section: Navigation Links */}
      <div className="flex items-center justify-center space-x-8 flex-1">
        <a href="#" className="flex flex-col items-center group">
          <span className="font-semibold text-orange-500">Saves</span>
          <span className="block w-full h-0.5 bg-orange-500"></span>
        </a>
        <a href="#" className="font-semibold hover:text-orange-500">
          Favorites
        </a>
        <a href="#" className="font-semibold hover:text-orange-500">
          Archives
        </a>
      </div>

      {/* Right section: Icons and User Avatar */}
      <div className="flex items-center space-x-4 w-1/4 justify-end">
        {/* Add URL Icon */}
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <PlusCircle size={20} className="text-gray-600" />
        </button>
        {/* Search Icon */}
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Search size={20} className="text-gray-600" />
        </button>

        {/* User Avatar with Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="h-8 w-8 border-2 border-orange-500 hover:border-orange-600 transition-colors">
                  <AvatarFallback className="bg-orange-100 text-orange-600">
                    {user.email ? user.email.charAt(0).toUpperCase() : ""}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={onSignOut}
                className="flex items-center cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut size={16} className="mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
