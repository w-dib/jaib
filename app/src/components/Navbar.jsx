import React, { useState, useEffect } from "react";
import {
  PlusSquare,
  Search,
  LogOut,
  Menu,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import logo from "../assets/icon48.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { Button } from "../../components/ui/button";
import AddUrlPrompt from "./AddUrlPrompt";
import SearchPrompt from "./SearchPrompt";
import ExtensionSetupDialog from "./ExtensionSetupDialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import { supabase } from "../lib/supabase";

function Navbar({ user, onSignOut, onArticleAdded, onOpenPremiumModal }) {
  const [isAddUrlOpen, setIsAddUrlOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isExtensionSetupOpen, setIsExtensionSetupOpen] = useState(false);
  const navigate = useNavigate();

  // Effect to show ExtensionSetupDialog on first login if no articles exist
  useEffect(() => {
    const checkAndShowExtensionDialog = async () => {
      if (
        user &&
        localStorage.getItem("hasSeenExtensionSetupDialog") !== "true"
      ) {
        try {
          const { count, error } = await supabase
            .from("articles")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);

          if (error) {
            console.error("Error fetching article count:", error);
            // Optionally, decide if dialog should show on error or not. For now, it won't.
            return;
          }

          if (count === 0) {
            setIsExtensionSetupOpen(true);
          }
        } catch (err) {
          console.error("Exception fetching article count:", err);
        }
      }
    };

    checkAndShowExtensionDialog();
  }, [user]); // Dependency array includes user, so it runs when user state changes

  const handleSearch = (searchTerm) => {
    console.log("Searching for:", searchTerm);
    setIsSearchOpen(false);
    setIsSheetOpen(false);
  };

  const handleAddUrlClick = () => {
    setIsAddUrlOpen(true);
    setIsSheetOpen(false);
  };

  const handleNavigateToBulkImport = () => {
    navigate("/import-pocket");
  };

  const handleNavLinkClickInSheet = () => {
    setIsSheetOpen(false);
  };

  const handleSignOutInSheet = () => {
    onSignOut();
    setIsSheetOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 bg-white w-full">
        {/* Left section: Logo and App Name (always visible) */}
        <Link
          to="/"
          className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-md"
        >
          <img src={logo} alt="Jaib Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-800">Jaib</span>
        </Link>

        {/* Middle section: Desktop Navigation Links */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center justify-center space-x-8">
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
            to="/tags"
            className={({ isActive }) =>
              `flex flex-col items-center group ${
                isActive
                  ? "text-orange-500"
                  : "text-gray-600 hover:text-orange-500"
              } px-2 py-1 rounded-md transition-colors`
            }
          >
            <span className="font-semibold">Tags</span>
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

        {/* Right section: Desktop Icons and User Avatar */}
        <div className="hidden md:flex items-center space-x-4">
          <Button
            onClick={() => setIsAddUrlOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 h-auto"
            aria-label="Save a URL"
          >
            <PlusSquare size={18} className="mr-2" />
            Import URL(s)
          </Button>
          <Button
            onClick={onOpenPremiumModal}
            variant="outline"
            className="border-orange-400 text-orange-600 hover:bg-orange-50 hover:text-orange-700 px-3 py-2 h-auto"
            aria-label="Go Premium"
          >
            <Sparkles size={18} className="mr-2" />
            Go Premium
          </Button>
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
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsExtensionSetupOpen(true)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Set up link saving"
                >
                  <HelpCircle size={20} className="text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set up link saving</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none">
                  <Avatar className="h-8 w-8 border-2 border-orange-500 hover:border-orange-600 transition-colors">
                    {user.user_metadata?.avatar_url && (
                      <AvatarImage
                        src={user.user_metadata.avatar_url}
                        alt={
                          user.user_metadata.name || user.email || "User avatar"
                        }
                      />
                    )}
                    <AvatarFallback className="bg-orange-100 text-orange-600">
                      {user.email ? user.email.charAt(0).toUpperCase() : "U"}
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

        {/* Mobile: Hamburger Menu */}
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" aria-label="Open menu" className="p-2">
                <Menu size={28} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[340px] p-6">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={handleAddUrlClick}
                  className="w-full justify-start bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <PlusSquare size={18} className="mr-2" /> Import URL(s)
                </Button>
                <Button
                  onClick={() => {
                    onOpenPremiumModal();
                    setIsSheetOpen(false);
                  }}
                  variant="outline"
                  className="w-full justify-start border-orange-400 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                >
                  <Sparkles size={18} className="mr-2" /> Go Premium
                </Button>
                <Button
                  onClick={() => {
                    setIsSearchOpen(true);
                    setIsSheetOpen(false);
                  }}
                  className="w-11/12 mx-auto justify-start px-3 py-2 h-auto text-base"
                  variant="outline"
                >
                  <Search size={18} className="mr-3" />
                  Search
                </Button>
                <Button
                  onClick={() => {
                    setIsExtensionSetupOpen(true);
                    setIsSheetOpen(false);
                  }}
                  className="w-11/12 mx-auto justify-start px-3 py-2 h-auto text-base border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                  variant="outline"
                >
                  <HelpCircle size={18} className="mr-3" />
                  Set up link saving
                </Button>

                <nav className="flex flex-col space-y-1.5 pt-4 border-t mt-3">
                  <NavLink
                    to="/"
                    end
                    onClick={handleNavLinkClickInSheet}
                    className={({ isActive }) =>
                      `flex items-center py-2.5 px-3 rounded-md text-base font-medium w-11/12 mx-auto ${
                        isActive
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`
                    }
                  >
                    Saves
                  </NavLink>
                  <NavLink
                    to="/favorites"
                    onClick={handleNavLinkClickInSheet}
                    className={({ isActive }) =>
                      `flex items-center py-2.5 px-3 rounded-md text-base font-medium w-11/12 mx-auto ${
                        isActive
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`
                    }
                  >
                    Favorites
                  </NavLink>
                  <NavLink
                    to="/tags"
                    onClick={handleNavLinkClickInSheet}
                    className={({ isActive }) =>
                      `flex items-center py-2.5 px-3 rounded-md text-base font-medium w-11/12 mx-auto ${
                        isActive
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`
                    }
                  >
                    Tags
                  </NavLink>
                  <NavLink
                    to="/archives"
                    onClick={handleNavLinkClickInSheet}
                    className={({ isActive }) =>
                      `flex items-center py-2.5 px-3 rounded-md text-base font-medium w-11/12 mx-auto ${
                        isActive
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`
                    }
                  >
                    Archives
                  </NavLink>
                </nav>
              </div>
              {user && (
                <SheetFooter className="mt-auto pt-6 border-t">
                  <div className="flex flex-col w-full space-y-3">
                    <div className="flex items-center space-x-3 px-1 w-11/12 mx-auto">
                      <Avatar className="h-9 w-9 border-2 border-orange-500">
                        {user.user_metadata?.avatar_url && (
                          <AvatarImage
                            src={user.user_metadata.avatar_url}
                            alt={
                              user.user_metadata.name ||
                              user.email ||
                              "User avatar"
                            }
                          />
                        )}
                        <AvatarFallback className="bg-orange-100 text-orange-600">
                          {user.email
                            ? user.email.charAt(0).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {user.email}
                      </span>
                    </div>
                    <Button
                      onClick={handleSignOutInSheet}
                      variant="outline"
                      className="w-11/12 mx-auto justify-center text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 text-base"
                    >
                      <LogOut size={16} className="mr-2" /> Sign Out
                    </Button>
                  </div>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      {isAddUrlOpen && (
        <AddUrlPrompt
          isOpen={isAddUrlOpen}
          onClose={() => setIsAddUrlOpen(false)}
          onAdd={onArticleAdded}
          onNavigateToBulkImport={handleNavigateToBulkImport}
        />
      )}
      {isSearchOpen && (
        <SearchPrompt
          isOpen={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          onSearch={handleSearch}
        />
      )}
      {isExtensionSetupOpen && (
        <ExtensionSetupDialog
          isOpen={isExtensionSetupOpen}
          onOpenChange={setIsExtensionSetupOpen}
        />
      )}
    </>
  );
}

export default Navbar;
