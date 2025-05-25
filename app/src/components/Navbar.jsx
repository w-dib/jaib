import React, { useState } from "react";
import { Link as LinkIcon, Search, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import logo from "../assets/icon48.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import AddUrlPrompt from "./AddUrlPrompt";
import SearchPrompt from "./SearchPrompt";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

function Navbar({ user, onSignOut }) {
  const [isAddUrlOpen, setIsAddUrlOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const handleAddUrl = async (url) => {
    if (!currentUser) {
      console.error("User not authenticated to add URL");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("articles")
        .insert([
          {
            url: url,
            user_id: currentUser.id,
            title: url,
          },
        ])
        .select();

      if (error) {
        throw error;
      }
      console.log("Article added:", data);
    } catch (error) {
      console.error("Error adding URL:", error.message);
    }
  };

  const handleSearch = (searchTerm) => {
    console.log("Searching for:", searchTerm);
    setIsSearchOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center px-6 py-3 border-b border-gray-200 bg-white w-full">
        {/* Left section: Logo and App Name */}
        <div className="flex items-center space-x-2 flex-grow-0">
          <img src={logo} alt="Jaib Logo" className="h-8 w-8" />
          <span className="text-xl font-bold">Jaib</span>
        </div>

        {/* Middle section: Navigation Links */}
        <div className="flex items-center justify-center space-x-8 flex-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center group ${
                isActive
                  ? "text-orange-500"
                  : "text-gray-600 hover:text-orange-500"
              } px-2 py-1 rounded-md transition-colors`
            }
          >
            <span className="font-semibold">Saves</span>
            {({ isActive }) =>
              isActive && (
                <span className="block w-full h-0.5 bg-orange-500"></span>
              )
            }
          </NavLink>
          <NavLink
            to="/favorites"
            className={({ isActive }) =>
              `flex flex-col items-center group ${
                isActive
                  ? "text-orange-500"
                  : "text-gray-600 hover:text-orange-500"
              } px-2 py-1 rounded-md transition-colors`
            }
          >
            <span className="font-semibold">Favorites</span>
            {({ isActive }) =>
              isActive && (
                <span className="block w-full h-0.5 bg-orange-500"></span>
              )
            }
          </NavLink>
          <NavLink
            to="/archives"
            className={({ isActive }) =>
              `flex flex-col items-center group ${
                isActive
                  ? "text-orange-500"
                  : "text-gray-600 hover:text-orange-500"
              } px-2 py-1 rounded-md transition-colors`
            }
          >
            <span className="font-semibold">Archives</span>
            {({ isActive }) =>
              isActive && (
                <span className="block w-full h-0.5 bg-orange-500"></span>
              )
            }
          </NavLink>
        </div>

        {/* Right section: Icons and User Avatar */}
        <div className="flex items-center space-x-4 flex-grow-0 justify-end">
          {/* Add URL Icon */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsAddUrlOpen(true)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Save a URL"
                >
                  <LinkIcon size={20} className="text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save a URL</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Search Icon */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Search"
                >
                  <Search size={20} className="text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
              <DropdownMenuContent align="end" className="w-48 dropdown-menu">
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
      <AddUrlPrompt
        isOpen={isAddUrlOpen}
        onClose={() => setIsAddUrlOpen(false)}
        onAdd={handleAddUrl}
      />
      <SearchPrompt
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearch}
      />
    </>
  );
}

export default Navbar;
