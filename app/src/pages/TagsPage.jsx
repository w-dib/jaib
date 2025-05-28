import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";

// Import ShadCN components from the correct path
import { Button } from "../../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";

// Import ArticleGrid and Skeleton from the correct path
import ArticleGrid from "../components/ArticleGrid";
import ArticleGridSkeleton from "../components/ArticleGridSkeleton";

function TagsPage() {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [articlesForTag, setArticlesForTag] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // State for Edit Tag Dialog
  const [isEditTagDialogOpen, setIsEditTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTagName, setNewTagName] = useState("");
  const [editError, setEditError] = useState(null);

  // State for Delete Tag Dialog
  const [isDeleteTagDialogOpen, setIsDeleteTagDialogOpen] = useState(false);
  const [deletingTag, setDeletingTag] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    const fetchTags = async () => {
      if (!user) {
        setLoadingTags(false);
        return;
      }
      setLoadingTags(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("tags")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name", { ascending: true });

        if (fetchError) {
          throw fetchError;
        }
        setTags(data || []);
      } catch (err) {
        console.error("Error fetching tags:", err);
        setError(err.message);
      } finally {
        setLoadingTags(false);
      }
    };

    if (!selectedTag) {
      fetchTags();
    }
  }, [user, selectedTag]);

  const fetchArticlesForTag = async (tagId) => {
    if (!user || !tagId) return;
    setLoadingArticles(true);
    setError(null);
    setArticlesForTag([]);

    try {
      const { data: articleTagLinks, error: articleTagError } = await supabase
        .from("article_tags")
        .select("article_id")
        .eq("user_id", user.id)
        .eq("tag_id", tagId);

      if (articleTagError) throw articleTagError;

      if (!articleTagLinks || articleTagLinks.length === 0) {
        setArticlesForTag([]);
        setLoadingArticles(false);
        return;
      }

      const articleIds = articleTagLinks.map((link) => link.article_id);

      const { data: articlesData, error: articlesError } = await supabase
        .from("articles")
        .select("*")
        .in("id", articleIds)
        .order("saved_at", { ascending: false });

      if (articlesError) throw articlesError;

      setArticlesForTag(articlesData || []);
    } catch (err) {
      console.error(`Error fetching articles for tag ${tagId}:`, err);
      setError(`Failed to load articles for ${selectedTag?.name || "tag"}.`);
      setArticlesForTag([]);
    } finally {
      setLoadingArticles(false);
    }
  };

  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
    fetchArticlesForTag(tag.id);
  };

  const clearSelectedTag = () => {
    setSelectedTag(null);
    setArticlesForTag([]);
    setError(null);
  };

  const openEditTagDialog = (tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setEditError(null);
    setIsEditTagDialogOpen(true);
  };

  const handleSaveEditedTag = async (event) => {
    if (event) event.preventDefault();

    if (!editingTag || !newTagName.trim()) {
      setEditError("Tag name cannot be empty.");
      return;
    }
    if (newTagName.trim() === editingTag.name) {
      setIsEditTagDialogOpen(false);
      return;
    }
    setEditError(null);

    try {
      const { data, error: updateError } = await supabase
        .from("tags")
        .update({ name: newTagName.trim() })
        .eq("id", editingTag.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setTags((currentTags) =>
        currentTags.map((t) => (t.id === editingTag.id ? data : t))
      );
      if (selectedTag && selectedTag.id === editingTag.id) {
        setSelectedTag(data);
      }

      setIsEditTagDialogOpen(false);
      setEditingTag(null);
      setNewTagName("");
    } catch (err) {
      console.error("Error updating tag name:", err);
      setEditError(
        err.message ||
          "Failed to update tag name. It might already exist or there was a network issue."
      );
    }
  };

  const openDeleteTagDialog = (tag) => {
    setDeletingTag(tag);
    setDeleteError(null);
    setIsDeleteTagDialogOpen(true);
  };

  const handleConfirmDeleteTag = async () => {
    if (!deletingTag) return;
    setDeleteError(null);

    try {
      const { error: deleteSupabaseError } = await supabase
        .from("tags")
        .delete()
        .eq("id", deletingTag.id)
        .eq("user_id", user.id);

      if (deleteSupabaseError) {
        throw deleteSupabaseError;
      }

      setTags((currentTags) =>
        currentTags.filter((t) => t.id !== deletingTag.id)
      );

      setIsDeleteTagDialogOpen(false);
      setDeletingTag(null);
      clearSelectedTag();
    } catch (err) {
      console.error("Error deleting tag:", err);
      setDeleteError(err.message || "Failed to delete tag. Please try again.");
    }
  };

  const handleArticleAction = () => {
    if (selectedTag) {
      fetchArticlesForTag(selectedTag.id);
    }
  };

  if (loadingTags && !selectedTag) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading tags...</p>
      </div>
    );
  }

  if (
    error &&
    !loadingArticles &&
    !isEditTagDialogOpen &&
    !isDeleteTagDialogOpen
  ) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">{error}</p>
        {selectedTag && (
          <Button onClick={clearSelectedTag} variant="outline" className="mt-4">
            Back to All Tags
          </Button>
        )}
      </div>
    );
  }

  if (selectedTag) {
    return (
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex items-start justify-between">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSelectedTag}
                  aria-label="Back to all tags"
                  className="mr-2 mt-1"
                >
                  <ArrowLeft size={22} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>All Tags</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex flex-col items-start flex-grow">
            <h1
              className="text-3xl font-bold text-gray-800 truncate max-w-full py-1"
              title={selectedTag.name}
            >
              URLs tagged "{selectedTag.name}"
            </h1>
            <div className="flex items-center space-x-2 mt-2">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditTagDialog(selectedTag)}
                      aria-label="Edit tag name"
                      className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Pencil size={20} className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit name</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteTagDialog(selectedTag)}
                      aria-label="Delete tag"
                      className="p-2 rounded-full text-red-600 hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 size={20} className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete tag</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </header>

        {editingTag && (
          <Dialog
            open={isEditTagDialogOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setEditingTag(null);
                setNewTagName("");
                setEditError(null);
              }
              setIsEditTagDialogOpen(isOpen);
            }}
          >
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSaveEditedTag}>
                <DialogHeader>
                  <DialogTitle>Edit Tag Name</DialogTitle>
                  <DialogDescription>
                    Change the name of your tag "{editingTag.name}". Make sure
                    it's unique.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input
                    id="name-edit"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter new tag name"
                    className={editError ? "border-red-500" : ""}
                    autoFocus
                  />
                  {editError && (
                    <p className="text-sm text-red-500 px-1">{editError}</p>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {deletingTag && (
          <Dialog
            open={isDeleteTagDialogOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setDeletingTag(null);
                setDeleteError(null);
              }
              setIsDeleteTagDialogOpen(isOpen);
            }}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Tag: "{deletingTag.name}"?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this tag? All articles
                  associated with this tag will lose this tag. This action
                  cannot be undone.
                </DialogDescription>
                {deleteError && (
                  <p className="text-sm text-red-500 mt-2 px-1">
                    {deleteError}
                  </p>
                )}
              </DialogHeader>
              <DialogFooter className="mt-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleConfirmDeleteTag}>
                  Delete Tag
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {loadingArticles && <ArticleGridSkeleton />}
        {!loadingArticles && error && (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        )}
        {!loadingArticles && !error && articlesForTag.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">
              No articles found for "{selectedTag.name}".
            </p>
          </div>
        )}
        {!loadingArticles && !error && articlesForTag.length > 0 && (
          <ArticleGrid
            articles={articlesForTag}
            onArticleDeleted={handleArticleAction}
            onArticleArchived={handleArticleAction}
            onArticleFavorited={handleArticleAction}
          />
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {tags.length === 0 && !loadingTags && (
        <p className="text-center text-gray-500">
          No tags found. Start tagging your articles!
        </p>
      )}
      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagSelect(tag)}
            title={`View articles tagged with ${tag.name}`}
            className="bg-orange-100 text-orange-700 font-medium px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base rounded-lg hover:bg-orange-200 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-75"
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TagsPage;
