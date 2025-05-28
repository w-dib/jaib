import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Loader2, X, Tag as TagIcon } from "lucide-react";

function TaggingDialog({ isOpen, onOpenChange, articleId, userId }) {
  const [tags, setTags] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch existing tags for the current article when the dialog opens
  useEffect(() => {
    if (isOpen && articleId && userId) {
      const fetchCurrentArticleTags = async () => {
        try {
          const { data, error: fetchErr } = await supabase
            .from("article_tags")
            .select("tags(name)") // Select name from the related tags table
            .eq("article_id", articleId)
            .eq("user_id", userId);

          if (fetchErr) throw fetchErr;
          if (data) {
            setTags(data.map((t) => t.tags.name));
            setInputValue(""); // Clear input field after loading tags
          }
        } catch (err) {
          console.error("Error fetching current article tags:", err);
          setError("Failed to load existing tags: " + err.message);
        }
      };
      fetchCurrentArticleTags();
    } else if (!isOpen) {
      // Reset state when dialog is closed
      setTags([]);
      setInputValue("");
      setError(null);
    }
  }, [isOpen, articleId, userId]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.endsWith(",")) {
      const newTag = value.slice(0, -1).trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue(""); // Clear input after tag is added
    } else {
      setInputValue(value);
    }
  };

  const handleInputKeyDown = (e) => {
    // Comma handling is now in handleInputChange
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault(); // Prevent default for Tab and Enter
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      setTags(tags.slice(0, -1)); // Remove the last tag
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSaveTags = async () => {
    if (!articleId || !userId) {
      setError("Article ID or User ID is missing.");
      return;
    }
    setIsSaving(true);
    setError(null);

    const tagNames = tags.filter((tag) => tag.trim() !== ""); // Use the tags array state

    if (tagNames.length === 0) {
      try {
        const { error: deleteError } = await supabase
          .from("article_tags")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", userId);
        if (deleteError) throw deleteError;
        console.log("All tags removed for article:", articleId);
        onOpenChange(false);
      } catch (err) {
        console.error("Error deleting existing tags:", err);
        setError("Failed to remove existing tags. " + err.message);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    try {
      const upsertedTags = await Promise.all(
        tagNames.map(async (name) => {
          let { data: existingTag, error: fetchError } = await supabase
            .from("tags")
            .select("id, name")
            .eq("user_id", userId)
            .eq("name", name)
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            throw fetchError;
          }
          if (existingTag) return existingTag;

          const { data: newTag, error: insertError } = await supabase
            .from("tags")
            .insert({ user_id: userId, name: name })
            .select("id, name")
            .single();
          if (insertError) throw insertError;
          return newTag;
        })
      );

      const { error: deleteError } = await supabase
        .from("article_tags")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;

      const articleTagLinks = upsertedTags.map((tag) => ({
        article_id: articleId,
        tag_id: tag.id,
        user_id: userId,
      }));
      const { error: linkError } = await supabase
        .from("article_tags")
        .insert(articleTagLinks);
      if (linkError) throw linkError;

      console.log("Tags saved successfully for article:", articleId);
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving tags:", err);
      setError("Failed to save tags. " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // if (!isOpen) return null; // Dialog handles its own visibility based on `open` prop

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tags</DialogTitle>
          {error && (
            <DialogDescription className="text-red-500 pt-2">
              Error: {error}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2">
          <div className="flex flex-wrap items-center gap-2 p-2 border border-input rounded-md min-h-[40px]">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="flex items-center gap-1 bg-orange-100 text-orange-700 text-sm font-medium px-2.5 py-0.5 rounded-md"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-orange-500 hover:text-orange-700"
                  aria-label={`Remove ${tag}`}
                  disabled={isSaving}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder={
                tags.length === 0
                  ? 'To add multiple tags, just press "," or the "Tab" key.'
                  : ""
              }
              className="flex-grow p-1 outline-none bg-transparent text-sm"
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSaveTags}
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TaggingDialog;
