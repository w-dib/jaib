import React, { useState } from "react";
import {
  Save,
  Star,
  TagsIcon,
  Archive,
  PlusSquare,
  Sparkles,
  Search,
  HelpCircle,
  LogOut,
  MenuIcon,
} from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import logo from "../assets/icon48.png"; // Assuming this path is correct
import { Button } from "../../components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar"; // Assuming ShadCN UI avatar
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet"; // For mobile drawer

// Re-import or redefine prompts/dialogs if they are not globally available
// For now, we assume they will be passed as props or handled via context if needed
// import AddUrlPrompt from "./AddUrlPrompt";
// import SearchPrompt from "./SearchPrompt";
// import ExtensionSetupDialog from "./ExtensionSetupDialog";
// import PremiumModal from "./PremiumModal";

function Sidebar({
  user,
  onSignOut,
  onOpenAddUrlModal,
  onOpenPremiumModal,
  onOpenSearchModal, // New prop for search
  onOpenExtensionSetupDialog, // New prop for extension setup
}) {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const commonNavLinkClasses =
    "flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150";
  const activeNavLinkClasses =
    "bg-orange-100 dark:bg-orange-700/30 text-orange-600 dark:text-orange-400 font-semibold";
  const inactiveNavLinkClasses = "text-gray-700 dark:text-gray-300";

  const getNavLinkClass = ({ isActive }) =>
    `${commonNavLinkClasses} ${
      isActive ? activeNavLinkClasses : inactiveNavLinkClasses
    }`;

  const handleMobileLinkClick = () => setIsMobileSheetOpen(false);

  const mainNavigation = (
    <nav className="flex-grow px-3 space-y-1.5">
      <NavLink
        to="/"
        end
        className={getNavLinkClass}
        onClick={handleMobileLinkClick}
      >
        <Save size={20} />
        <span>Saves</span>
      </NavLink>
      <NavLink
        to="/favorites"
        className={getNavLinkClass}
        onClick={handleMobileLinkClick}
      >
        <Star size={20} />
        <span>Favorites</span>
      </NavLink>
      <NavLink
        to="/archives"
        className={getNavLinkClass}
        onClick={handleMobileLinkClick}
      >
        <Archive size={20} />
        <span>Archives</span>
      </NavLink>
      <NavLink
        to="/tags"
        className={getNavLinkClass}
        onClick={handleMobileLinkClick}
      >
        <TagsIcon size={20} />
        <span>Tags</span>
      </NavLink>
    </nav>
  );

  const actionButtons = (
    <div className="px-3 mt-4 space-y-2">
      <Button
        onClick={() => {
          onOpenAddUrlModal();
          handleMobileLinkClick();
        }}
        className="w-full justify-start bg-orange-500 hover:bg-orange-600 text-white"
      >
        <PlusSquare size={18} className="mr-2" />
        Import URL(s)
      </Button>
      <Button
        onClick={() => {
          onOpenPremiumModal();
          handleMobileLinkClick();
        }}
        variant="outline"
        className="w-full justify-start border-orange-400 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-700/20 dark:hover:text-orange-300"
      >
        <Sparkles size={18} className="mr-2" />
        Go Premium
      </Button>
    </div>
  );

  const userMenu = user ? (
    <div className="mt-2 p-1.5 border-t dark:border-gray-700">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between text-left p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center space-x-2 overflow-hidden">
              <Avatar className="h-8 w-8 border-2 border-orange-500">
                {user.user_metadata?.avatar_url && (
                  <AvatarImage
                    src={user.user_metadata.avatar_url}
                    alt="User avatar"
                  />
                )}
                <AvatarFallback className="bg-orange-100 text-orange-600 dark:bg-orange-700/30 dark:text-orange-400">
                  {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {user.email}
              </span>
            </div>
            {/* <ChevronUpDownIcon className="h-4 w-4 text-gray-400" /> // Optional: if you want an indicator */}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
          <DropdownMenuItem
            onClick={() => {
              onOpenExtensionSetupDialog();
              handleMobileLinkClick();
            }}
          >
            <HelpCircle size={16} className="mr-2" /> Set up link saving
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              onSignOut();
              handleMobileLinkClick();
            }}
            className="text-red-600 hover:!text-red-700 dark:text-red-400 dark:hover:!text-red-500 focus:bg-red-50 dark:focus:bg-red-700/20"
          >
            <LogOut size={16} className="mr-2" /> Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : null;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <Link
          to="/"
          className="flex items-center space-x-2"
          onClick={handleMobileLinkClick}
        >
          <img src={logo} alt="Jaib Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-800 dark:text-white">
            Jaib
          </span>
        </Link>
      </div>

      {/* Search - Placeholder for now */}
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start text-gray-500 dark:text-gray-400"
          onClick={() => {
            onOpenSearchModal();
            handleMobileLinkClick();
          }}
        >
          <Search size={18} className="mr-2" /> Search...
        </Button>
      </div>

      {mainNavigation}
      {actionButtons}
      {userMenu}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Hamburger Menu */}
      <div className="md:hidden p-2 sticky top-0 bg-white dark:bg-gray-800 z-40 border-b dark:border-gray-700 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="Jaib Logo" className="h-7 w-7" />
          <span className="text-lg font-bold text-gray-800 dark:text-white">
            Jaib
          </span>
        </Link>
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <MenuIcon
                size={24}
                className="text-gray-700 dark:text-gray-200"
              />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export default Sidebar;
