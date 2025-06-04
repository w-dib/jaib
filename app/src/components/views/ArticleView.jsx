import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  ArrowLeft,
  Highlighter as HighlighterIcon,
  Share2 as ShareIcon,
  MoreHorizontal,
  MoreVertical, // ADDED: For the new options button
} from "lucide-react";
// Import updated icons based on user feedback
import {
  Star, // For Favorite/Unfavorite
  Highlighter, // For Tag (as Placeholder)
  BookDown, // For Archive (if not read)
  BookUp, // For Archive (if read)
  Trash2, // For Delete
  ExternalLink, // Added for View Original link
  Tag, // IMPORTED: For Tagging
  Quote, // ADDED: For highlight card UI improvement
  Headphones, // ADDED: For Audio Player
  HeadphoneOff, // ADDED: For Audio Player (If this causes error, replace with EarOff or similar)
  RotateCcw, // ADDED: For Audio Player (Rewind)
  RotateCw, // ADDED: For Audio Player (Fast-forward)
  X as XIcon, // ADDED: For Audio Player (Close)
} from "lucide-react";

// Import ShadCN Dialog components with corrected path
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button"; // Corrected path
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip"; // Added Tooltip imports
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverTrigger,
} from "../../../components/ui/popover"; // Added Popover imports
import { Skeleton } from "../../../components/ui/skeleton"; // Added import for skeleton
import TaggingDialog from "./TaggingDialog"; // IMPORTED: For Tagging Dialog
import { toast } from "sonner"; // Import toast function
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../../components/ui/sheet"; // IMPORTED: For Highlights Sheet
import AudioPlayerCard from "./AudioPlayerCard"; // ADDED: Import AudioPlayerCard
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"; // ADDED: Dropdown imports
import ShareDialog from "../../components/ShareDialog"; // ADDED: Import ShareDialog (adjust path if needed)

function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id; // ADDED: Define userId for stable dependency
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const contentRef = useRef(null); // Ref for the article content div
  const [readingProgress, setReadingProgress] = useState(0); // State for reading progress
  const selectionChangeTimeoutRef = useRef(null); // Ref for debouncing selectionchange

  // Local state for favorite and read status, initialized from fetched article
  const [isFavorited, setIsFavorited] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTaggingDialogOpen, setIsTaggingDialogOpen] = useState(false); // ADDED: State for tagging dialog

  // State for text selection popover
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverAnchorRect, setPopoverAnchorRect] = useState(null);
  const [selectionRects, setSelectionRects] = useState([]);
  const popoverRef = useRef(null);
  const [savedHighlights, setSavedHighlights] = useState([]);
  const [selectedTextContent, setSelectedTextContent] = useState("");
  const [isHighlightSheetOpen, setIsHighlightSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDeleteHighlightDialogOpen, setIsDeleteHighlightDialogOpen] =
    useState(false);
  const [highlightToDeleteId, setHighlightToDeleteId] = useState(null);
  const [isShareViewDialogOpen, setIsShareViewDialogOpen] = useState(false); // ADDED: State for ShareDialog

  // State for Audio Player (using HTML5 Audio + Edge Function)
  const [isAudioPlayerVisible, setIsAudioPlayerVisible] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null); // Ref for the <audio> element
  const [audioLoading, setAudioLoading] = useState(false); // To show loading state for TTS
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // NEW: Handler for the main navigation audio button
  const handleNavAudioButtonClick = () => {
    if (isAudioPlayerVisible) {
      // If player is visible, close it.
      // handleCloseAudioPlayer handles pausing, cleaning up, and setting relevant states.
      handleCloseAudioPlayer();
    } else {
      // If player is hidden, show it.
      // The actual fetching/playing will be initiated by the AudioPlayerCard's own play button
      // which uses the original handlePlayPauseAudio function.
      setIsAudioPlayerVisible(true);
      // Ensure audio is paused if it was somehow playing and card was hidden without full cleanup.
      // This helps ensure the card starts in a predictable (paused) state if audioUrl already exists.
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause(); // This will set isPlayingAudio = false via event listener
      }
    }
  };

  // Fetch TTS audio from Supabase Edge Function
  const fetchTTSAudio = async (htmlContent) => {
    console.log("[ArticleView] fetchTTSAudio: Called with HTML content."); // LOG 1

    // The Edge Function will now handle HTML parsing.
    // We send the raw HTML content directly.
    if (
      !htmlContent ||
      typeof htmlContent !== "string" ||
      htmlContent.trim() === ""
    ) {
      toast.error("No HTML content available to read.");
      console.warn(
        "[ArticleView] fetchTTSAudio: No HTML content provided or empty."
      ); // LOG 2
      setAudioLoading(false);
      return;
    }
    setAudioLoading(true);
    setAudioUrl(null);
    setCurrentTime(0);
    setDuration(0);
    console.log(
      "[ArticleView] fetchTTSAudio: audioLoading set to true. HTML content to send (start):",
      htmlContent.substring(0, 100)
    ); // LOG 3

    try {
      console.log(
        "[ArticleView] fetchTTSAudio: Attempting to invoke Supabase function text-to-speech with HTML."
      ); // LOG 4
      const response = await supabase.functions.invoke("text-to-speech", {
        body: { text: htmlContent }, // Send HTML content directly
      });
      console.log(
        "[ArticleView] fetchTTSAudio: Supabase function response received:",
        response
      ); // LOG 5

      if (response.error) {
        throw new Error(
          response.error.message || "TTS function invocation failed"
        );
      }

      if (!response.data) {
        throw new Error("No audio data received from TTS function.");
      }

      const contentType = response.headers?.get("content-type") || "audio/mpeg";
      console.log(
        "[ArticleView] fetchTTSAudio: Audio content type:",
        contentType
      ); // LOG 6
      const audioBlob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(audioBlob);
      console.log("[ArticleView] fetchTTSAudio: Audio Blob URL created:", url); // LOG 7
      setAudioUrl(url);
      setIsAudioPlayerVisible(true);
    } catch (err) {
      console.error("[ArticleView] fetchTTSAudio: Error:", err); // LOG 8
      toast.error(`Failed to generate audio: ${err.message}`);
      setAudioUrl(null);
      setIsAudioPlayerVisible(false);
    } finally {
      setAudioLoading(false);
      console.log(
        "[ArticleView] fetchTTSAudio: finally block, audioLoading set to false."
      ); // LOG 9
    }
  };

  // Handle Play/Pause for the new <audio> element
  const handlePlayPauseAudio = async () => {
    console.log("[ArticleView] handlePlayPauseAudio: Called."); // LOG A
    console.log(
      `[ArticleView] handlePlayPauseAudio: Initial states - audioLoading: ${audioLoading}, audioUrl: ${audioUrl}, article loaded: ${!!article}`
    ); // LOG B
    if (article) {
      console.log(
        `[ArticleView] handlePlayPauseAudio: article.content (HTML) available: ${!!article.content}, length: ${
          article.content?.length
        }`
      ); // LOG C
    }

    if (audioLoading) {
      toast.info("Audio is currently generating...");
      console.log(
        "[ArticleView] handlePlayPauseAudio: Exiting because audioLoading is true."
      ); // LOG D
      return;
    }

    if (!audioUrl && article && article.content) {
      console.log(
        "[ArticleView] handlePlayPauseAudio: Condition met to fetch audio. Calling fetchTTSAudio with article.content (HTML)."
      ); // LOG E
      await fetchTTSAudio(article.content); // article.content is HTML, Edge function will parse
    } else if (audioRef.current) {
      console.log(
        "[ArticleView] handlePlayPauseAudio: Condition met to play/pause existing audio. Audio paused:",
        audioRef.current.paused
      ); // LOG F
      if (audioRef.current.paused) {
        audioRef.current
          .play()
          .catch((e) => console.error("Error playing audio:", e));
      } else {
        audioRef.current.pause();
      }
      if (!isAudioPlayerVisible) setIsAudioPlayerVisible(true);
    } else {
      console.warn(
        "[ArticleView] handlePlayPauseAudio: No action taken - conditions not met."
      ); // LOG G
      if (!article || !article.content) {
        toast.error("Article content not available to read.");
        console.warn(
          "[ArticleView] handlePlayPauseAudio: Article or article.content (HTML) not available."
        ); // LOG H
      } else if (audioUrl && !audioRef.current) {
        console.warn(
          "[ArticleView] handlePlayPauseAudio: audioUrl exists, but audioRef.current is null. This is unexpected."
        ); // LOG I
      }
    }
  };

  // Handle closing the audio player
  const handleCloseAudioPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      // Revoke the object URL to free up resources
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    }
    setAudioUrl(null);
    setIsAudioPlayerVisible(false);
    setIsPlayingAudio(false);
    setCurrentTime(0);
    setDuration(0);
  };

  // Effect for <audio> element event listeners
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handlePlay = () => setIsPlayingAudio(true);
      const handlePause = () => setIsPlayingAudio(false);
      const handleEnded = () => {
        setIsPlayingAudio(false);
        setCurrentTime(audioElement.duration); // Show full duration at end
        // Optionally close player: handleCloseAudioPlayer();
      };
      const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
      const handleLoadedMetadata = () => setDuration(audioElement.duration);
      const handleCanPlay = () => {
        // Autoplay if it was intended (e.g., if audioUrl was just set and user clicked play)
        if (isAudioPlayerVisible && !isPlayingAudio) {
          // Check if it should start playing
          audioElement
            .play()
            .catch((e) => console.error("Autoplay failed:", e));
        }
      };
      const handleError = (e) => {
        console.error("Audio element error:", e);
        toast.error("Error playing audio.");
        handleCloseAudioPlayer(); // Close on error
      };

      audioElement.addEventListener("play", handlePlay);
      audioElement.addEventListener("pause", handlePause);
      audioElement.addEventListener("ended", handleEnded);
      audioElement.addEventListener("timeupdate", handleTimeUpdate);
      audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.addEventListener("canplay", handleCanPlay);
      audioElement.addEventListener("error", handleError);

      // Set initial playback rate
      audioElement.playbackRate = playbackSpeed;

      return () => {
        audioElement.removeEventListener("play", handlePlay);
        audioElement.removeEventListener("pause", handlePause);
        audioElement.removeEventListener("ended", handleEnded);
        audioElement.removeEventListener("timeupdate", handleTimeUpdate);
        audioElement.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        audioElement.removeEventListener("canplay", handleCanPlay);
        audioElement.removeEventListener("error", handleError);
      };
    }
  }, [audioUrl, playbackSpeed]); // Rerun when audioUrl or playbackSpeed changes

  // Cleanup audio object URL on component unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Helper function to find text in DOM and return its rects
  // For simplicity with current selector_info, this finds the FIRST match.
  const findTextRectsInDOM = (containerElement, searchText) => {
    if (!containerElement || !searchText || typeof searchText !== "string")
      return [];
    const walker = document.createTreeWalker(
      containerElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    let node;

    while ((node = walker.nextNode())) {
      const index = node.nodeValue.indexOf(searchText);
      if (index !== -1) {
        const range = document.createRange();
        try {
          range.setStart(node, index);
          range.setEnd(node, index + searchText.length);
          const rects = Array.from(range.getClientRects()).map((rect) => ({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          }));
          if (rects.length > 0) {
            return rects; // Return rects for the first match
          }
        } catch (e) {
          console.error("Error creating range for saved highlight:", e, {
            searchText,
            nodeValue: node.nodeValue,
          });
          return []; // Stop if an error occurs for this node/text
        }
      }
    }
    return []; // Return empty if not found after checking all nodes
  };

  useEffect(() => {
    if (article && article.title) {
      document.title = `Jaib - ${article.title}`;
    } else {
      document.title = "Jaib"; // Default title if no article or title
    }

    // Cleanup function to reset title when component unmounts or article changes
    return () => {
      document.title = "Jaib";
    };
  }, [article]); // Re-run effect when article changes

  useEffect(() => {
    const fetchArticle = async () => {
      if (!userId) {
        // UPDATED: Check userId instead of user
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("articles")
        .select("*, last_read_scroll_percentage")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching article:", error);
        setError(error.message);
        setArticle(null); // Ensure article is null on error
      } else {
        setArticle(data);
        // Initialize local state from fetched article data
        setIsFavorited(data?.is_favorite || false);
        setIsRead(data?.is_read || false);

        // Apply saved scroll position
        if (
          data?.last_read_scroll_percentage &&
          data.last_read_scroll_percentage > 0 &&
          data.last_read_scroll_percentage < 100
        ) {
          // Apply after a short delay to allow content to render and height to be calculated
          setTimeout(() => {
            if (contentRef.current) {
              // Ensure contentRef is available
              const scrollableHeight =
                document.body.scrollHeight - window.innerHeight;
              if (scrollableHeight > 0) {
                const targetScrollTop =
                  scrollableHeight * (data.last_read_scroll_percentage / 100);
                window.scrollTo({ top: targetScrollTop, behavior: "auto" }); // 'auto' for instant jump
              }
            }
          }, 300); // Adjust delay if necessary
        }
      }
      setLoading(false);
    };

    fetchArticle();
  }, [id, userId]); // UPDATED: Dependency on userId instead of user

  // Effect for calculating reading progress
  useEffect(() => {
    const handleWindowScroll = () => {
      if (!contentRef.current) return;

      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const scrolled = totalHeight > 0 ? scrollTop / totalHeight : 1;
      const progress = scrolled * 100;

      setReadingProgress(progress);
    };

    window.addEventListener("scroll", handleWindowScroll);

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [article]); // Re-run effect when article content loads

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      // Only save if article is loaded, user exists, and progress is meaningful
      if (
        userId && // UPDATED: Check userId
        article &&
        article.id &&
        readingProgress > 0 &&
        readingProgress < 99
      ) {
        // Avoid saving 100% if they finished
        const savePosition = async () => {
          try {
            const { error: updateError } = await supabase
              .from("articles")
              .update({ last_read_scroll_percentage: readingProgress })
              .eq("id", article.id)
              .eq("user_id", user.id); // user.id is fine here, user object is from closure

            if (updateError) {
              console.error("Error saving scroll position:", updateError);
            } else {
              console.log(
                "Scroll position saved:",
                readingProgress,
                "for article ID:",
                article.id
              );
            }
          } catch (e) {
            console.error("Exception while saving scroll position:", e);
          }
        };
        // Check if navigator.sendBeacon is available for more reliable background sync
        // For simplicity now, we'll do a direct async call.
        // In a real app, consider navigator.sendBeacon for unmount tasks if the save must be guaranteed.
        savePosition();
      }
    };
  }, [userId, article, readingProgress, supabase]); // UPDATED: Dependencies for the cleanup effect

  // EFFECT: Load saved highlights when article is loaded
  useEffect(() => {
    const loadSavedAnnotations = async () => {
      if (!article || !article.id || !userId || !contentRef.current) {
        // UPDATED: Check userId
        // Ensure contentRef.current is also available for findTextRectsInDOM
        return;
      }

      console.log(
        "[] Attempting to load saved annotations for article:",
        article.id
      );

      try {
        const { data: annotations, error } = await supabase
          .from("annotations")
          .select("*")
          .eq("article_id", article.id)
          .eq("user_id", userId); // UPDATED: Use userId in query

        if (error) {
          console.error("Error fetching saved annotations:", error);
          return;
        }

        if (annotations && annotations.length > 0) {
          console.log("[] Fetched annotations:", annotations);
          const processedHighlights = [];
          for (const ann of annotations) {
            if (ann.note) {
              // ann.note stores the highlighted text (quote)
              // Ensure the DOM is likely ready. A small timeout might be more robust
              // but for now, we assume contentRef.current is populated when this effect runs after article load.
              const rects = findTextRectsInDOM(contentRef.current, ann.note);
              if (rects.length > 0) {
                processedHighlights.push({
                  id: ann.id,
                  rects: rects,
                  text: ann.note,
                  selectorInfo: ann.selector_info, // Keep original selector_info
                  created_at: ann.created_at, // ADDED: Ensure created_at is included
                });
              }
            }
          }
          console.log(
            "[] Processed highlights for display:",
            processedHighlights
          );
          setSavedHighlights(processedHighlights);
        }
      } catch (err) {
        console.error("Exception loading saved annotations:", err);
      }
    };

    // Call this after a brief delay to give dangerouslySetInnerHTML time to render
    // especially if article content is large.
    const timerId = setTimeout(loadSavedAnnotations, 100);

    return () => clearTimeout(timerId); // Cleanup timeout
  }, [article, userId, supabase]); // UPDATED: Rerun if article or userId changes

  // Recalculate progress when article loads
  useEffect(() => {
    const handleInitialProgress = () => {
      setTimeout(() => {
        if (!contentRef.current) return;
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        const scrollTop = window.scrollY;
        const scrolled = totalHeight > 0 ? scrollTop / totalHeight : 1;
        const progress = scrolled * 100;
        setReadingProgress(progress);
      }, 100);
    };
    if (article) {
      handleInitialProgress();
    }
  }, [article]);

  // Handle favoriting/unfavoriting
  const handleFavoriteToggle = async () => {
    if (!user || !article) return;
    const newState = !isFavorited;
    setIsFavorited(newState); // Optimistically update UI

    const { error } = await supabase
      .from("articles")
      .update({ is_favorite: newState })
      .eq("id", article.id);

    if (error) {
      console.error("Error updating favorite status:", error);
      setIsFavorited(!newState); // Revert UI on error
      // Optionally show an error message to the user
    } else {
      console.log("Favorite status updated successfully");
    }
  };

  // Handle archiving/unarchiving (marking as read/unread)
  const handleArchiveToggle = async () => {
    if (!user || !article) return;
    const newState = !isRead;
    setIsRead(newState); // Optimistically update UI

    const { error } = await supabase
      .from("articles")
      .update({ is_read: newState })
      .eq("id", article.id);

    if (error) {
      console.error("Error updating read status:", error);
      setIsRead(!newState); // Revert UI on error
      // Optionally show an error message
    } else {
      console.log("Read status updated successfully");
      // Decide if we should navigate back after archiving/unarchiving
      // navigate('/'); // Example: navigate back to Saves after archiving
    }
  };

  // Handle article deletion
  const handleDeleteArticle = async () => {
    if (!user || !article) return;

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", article.id);

    if (error) {
      console.error("Error deleting article:", error);
      // Optionally show an error message
    } else {
      console.log("Article deleted successfully");
      setIsDeleteDialogOpen(false); // Close dialog
      navigate("/"); // Navigate back to Saves view after deletion
    }
  };

  const handleSaveHighlight = async () => {
    console.log("[handleSaveHighlight] Called");
    console.log(
      "[handleSaveHighlight] selectedTextContent from state:",
      selectedTextContent
    );
    console.log("[handleSaveHighlight] article:", article);
    console.log("[handleSaveHighlight] user:", user);

    if (!article || !user) {
      console.error("[handleSaveHighlight] Aborting: Missing article or user.");
      return;
    }

    const selectedText = selectedTextContent.trim();
    console.log(
      "[handleSaveHighlight] selectedText (from state, trimmed):",
      selectedText
    );

    if (!selectedText) {
      console.warn(
        "[handleSaveHighlight] Aborting: Selected text is empty after trim."
      );
      return; // Don't save empty selections
    }

    const selectorInfo = {
      type: "text-quote",
      quote: selectedText,
    };

    const annotationData = {
      article_id: article.id,
      user_id: user.id,
      selector_info: selectorInfo,
      note: selectedText,
    };
    console.log(
      "[handleSaveHighlight] Attempting to save to Supabase with data:",
      annotationData
    );

    try {
      const { data, error } = await supabase
        .from("annotations")
        .insert([annotationData])
        .select()
        .single();

      console.log("[handleSaveHighlight] Supabase response data:", data);
      console.log("[handleSaveHighlight] Supabase response error:", error);

      if (error) {
        console.error(
          "[handleSaveHighlight] Error saving highlight to Supabase:",
          error
        );
        return;
      }

      if (data) {
        console.log("[handleSaveHighlight] Successfully saved. DB Data:", data);
        setSavedHighlights((prevHighlights) => [
          ...prevHighlights,
          {
            id: data.id,
            rects: [...selectionRects],
            text: selectedText,
            selectorInfo: selectorInfo,
            created_at: data.created_at, // ADDED: Ensure created_at is included
          },
        ]);
        setIsPopoverOpen(false);
        setSelectionRects([]);
        toast.success("Highlight Saved", {
          duration: 3000,
          style: {
            backgroundColor: "var(--accent)",
            borderColor: "oklch(0.7 0.15 40)",
            color: "var(--accent-foreground)",
          },
        });
      }
    } catch (e) {
      console.error("[handleSaveHighlight] Exception during Supabase call:", e);
    }
  };

  // EFFECT: Handle text selection for popover
  useEffect(() => {
    const handleTextSelectionEnd = () => {
      clearTimeout(selectionChangeTimeoutRef.current);
      selectionChangeTimeoutRef.current = setTimeout(() => {
        const selection = window.getSelection();
        if (
          selection &&
          !selection.isCollapsed &&
          selection.rangeCount > 0 &&
          contentRef.current && // Ensure contentRef.current exists
          contentRef.current.contains(
            selection.getRangeAt(0).commonAncestorContainer
          ) // Check selection is within content
        ) {
          const range = selection.getRangeAt(0);
          const rects = Array.from(range.getClientRects()).map((rect) => ({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          }));

          if (rects.length > 0) {
            const firstRect = rects[0];
            const textContent = range.toString();
            setSelectedTextContent(textContent);

            setPopoverAnchorRect({
              top: firstRect.top - 64,
              left: firstRect.left + firstRect.width / 2,
              width: 1,
              height: 1,
            });
            setSelectionRects(rects);
            setIsPopoverOpen(true);
            // No need to call selection.removeAllRanges() here if selectionchange is used,
            // as the visual selection itself is what we are reacting to.
            // If blue highlight persists and is an issue, it might need to be revisited.
          } else {
            setIsPopoverOpen(false);
            setSelectionRects([]);
          }
        } else {
          // If selection is outside contentRef or collapsed, close popover
          if (isPopoverOpen) {
            setIsPopoverOpen(false);
            setSelectionRects([]);
          }
        }
      }, 250); // 250ms debounce delay
    };

    document.addEventListener("selectionchange", handleTextSelectionEnd);

    return () => {
      document.removeEventListener("selectionchange", handleTextSelectionEnd);
      clearTimeout(selectionChangeTimeoutRef.current); // Clear timeout on cleanup
    };
  }, [
    contentRef,
    isPopoverOpen,
    setSelectedTextContent,
    setPopoverAnchorRect,
    setSelectionRects,
    setIsPopoverOpen,
  ]); // Dependencies

  // EFFECT: Handle clicks outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        // Check if the click is also outside the content area to avoid immediate re-triggering
        if (contentRef.current && !contentRef.current.contains(event.target)) {
          setIsPopoverOpen(false);
          setSelectionRects([]);
        } else {
          // If click is inside content but not on popover, it might be a new selection attempt or text de-selection
          const selection = window.getSelection();
          if (
            !selection ||
            selection.isCollapsed ||
            selection.rangeCount === 0
          ) {
            setIsPopoverOpen(false);
            setSelectionRects([]);
          }
        }
      }
    };

    if (isPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopoverOpen]);

  // ADDED: Function to handle deleting a highlight
  const handleDeleteHighlight = async (highlightId) => {
    // This function will now just open the confirmation dialog
    setHighlightToDeleteId(highlightId);
    setIsDeleteHighlightDialogOpen(true);
  };

  // ADDED: Function to confirm and execute highlight deletion
  const confirmDeleteHighlight = async () => {
    if (!user || !article || !highlightToDeleteId) return;

    const idToDelete = highlightToDeleteId;

    // Optimistically remove from UI
    setSavedHighlights((prevHighlights) =>
      prevHighlights.filter((h) => h.id !== idToDelete)
    );

    // Remove from Supabase
    const { error } = await supabase
      .from("annotations")
      .delete()
      .eq("id", idToDelete)
      .eq("user_id", user.id); // Ensure user owns the annotation

    if (error) {
      console.error("Error deleting highlight from Supabase:", error);
      toast.error("Failed to delete highlight.");
      // Potentially revert UI optimistic update here if needed
    } else {
      console.log("Highlight deleted successfully from Supabase:", idToDelete);
      toast.success("Highlight deleted.");
    }
    setIsDeleteHighlightDialogOpen(false); // Close dialog
    setHighlightToDeleteId(null); // Reset ID
  };

  // EFFECT: Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Common breakpoint for mobile
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return <Skeleton />; // Use the skeleton component
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-red-500">Error loading article: {error}</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p>Article not found.</p>
      </div>
    );
  }

  // Calculate icon size
  const iconSize = 20 * 1.3; // Approximately 1.3 times the original size (26)

  // Placeholder function for calculating reading time (if not already present or needs adjustment)
  // This might already exist in your ArticleCard or utils, adjust as needed.
  const calculateReadingTime = (text) => {
    if (!text) return "";
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  // Function to extract base URL (if not already present or needs adjustment)
  // This might already exist in your ArticleCard or utils, adjust as needed.
  const getBaseUrl = (url) => {
    try {
      const urlObject = new URL(url);
      return urlObject.hostname.replace(/^www\./, "");
    } catch {
      return "Source";
    }
  };

  return (
    <>
      {/* Custom Orange Highlight Overlays (Temporary Selection) */}
      {isPopoverOpen &&
        selectionRects.map((rect, index) => (
          <div
            key={`temp-highlight-rect-${index}`}
            style={{
              position: "absolute",
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              backgroundColor: "rgba(255, 165, 0, 0.3)", // Lighter orange for temporary
              zIndex: 10,
              pointerEvents: "none",
            }}
          />
        ))}

      {/* Saved Highlight Overlays */}
      {savedHighlights.map((highlight) =>
        highlight.rects.map((rect, index) => (
          <div
            key={`saved-highlight-${highlight.id}-rect-${index}`}
            style={{
              position: "absolute",
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              backgroundColor: "rgba(239, 108, 0, 0.4)",
              zIndex: 9,
              cursor: isMobile ? "pointer" : "default", // ADDED: Pointer cursor on mobile
            }}
            onClick={() => {
              if (isMobile) {
                setIsHighlightSheetOpen(true);
                // TODO: Consider scrolling to this specific highlight in the sheet later
              }
            }}
          />
        ))
      )}

      {/* Popover for Text Selection */}
      {isPopoverOpen && popoverAnchorRect && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverAnchor
            style={{
              position: "absolute",
              top: `${popoverAnchorRect.top}px`,
              left: `${popoverAnchorRect.left}px`,
              width: `${popoverAnchorRect.width}px`,
              height: `${popoverAnchorRect.height}px`,
            }}
          />
          <PopoverContent
            ref={popoverRef}
            className="w-auto p-2 shadow-xl rounded-md border bg-white z-50"
            sideOffset={5}
            align="center"
            onCloseAutoFocus={(e) => e.preventDefault()} // Prevent focus issues on close
          >
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1"
                onClick={handleSaveHighlight}
              >
                <HighlighterIcon size={16} />
                <span>Highlight</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1"
              >
                <ShareIcon size={16} />
                <span>Share</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Overall page container - handles vertical layout and overall page scrolling */}
      {/* Add a top margin to push content below the fixed header */}
      {/* Adjusted mt value slightly to account for increased header height */}
      <div className="flex flex-col items-center mt-[72px] pb-16 min-h-screen">
        {" "}
        {/* Adjusted mt-[68px] to mt-[72px] */}
        {/* Fixed Article Nav Bar - Explicit height set, py-4 removed, px-4 kept */}
        <div className="fixed top-0 w-full bg-white border-b border-gray-200 z-20 flex items-center justify-center h-16 px-4">
          {" "}
          {/* Reading progress bar - Moved inside the header, positioned at the bottom */}
          <div
            className="absolute bottom-0 left-0 h-1 bg-orange-500 z-30"
            style={{ width: `${readingProgress}%` }}
          ></div>
          {/* Left section: Back button - Positioned absolutely to the left */}
          <button
            onClick={() => navigate("/")}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors z-40"
            aria-label="Back to Saves"
          >
            {/* Increased icon size */}
            <ArrowLeft size={iconSize} className="text-gray-600" />
          </button>
          {/* Centered Action Icons Group */}
          {/* This div will be absolutely centered */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2 md:space-x-3 z-30">
            {/* Favorite Button */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleFavoriteToggle}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={isFavorited ? "Unfavorite" : "Favorite"}
                  >
                    <Star
                      size={iconSize}
                      className={
                        isFavorited
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-600"
                      }
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorited ? "Unfavorite" : "Favorite"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* ADDED: Audio Player Button */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleNavAudioButtonClick} // UPDATED onClick handler
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={
                      isAudioPlayerVisible
                        ? "Close Audio Player"
                        : "Play Article"
                    } // UPDATED aria-label
                    // Removed disabled={audioLoading} - nav button can always close the player
                  >
                    {isAudioPlayerVisible ? ( // UPDATED icon logic
                      <HeadphoneOff
                        size={iconSize}
                        className="text-orange-500" // Active color when player is visible
                      />
                    ) : (
                      <Headphones size={iconSize} className="text-gray-600" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isAudioPlayerVisible
                      ? "Close Audio Player"
                      : "Play Article"}
                  </p>{" "}
                  {/* UPDATED tooltip text */}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Archive Button */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleArchiveToggle}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={isRead ? "Unarchive" : "Archive"}
                  >
                    {isRead ? (
                      <BookUp size={iconSize} className="text-orange-500" />
                    ) : (
                      <BookDown size={iconSize} className="text-gray-600" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRead ? "Move to Saves" : "Archive"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>{" "}
          {/* End of Centered Action Icons Group */}
          {/* Right section: Options button with DropdownMenu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors z-40"
                aria-label="More options"
              >
                <MoreVertical size={iconSize} className="text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsTaggingDialogOpen(true)}>
                <Tag size={16} className="mr-2" />
                Tag URL
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsHighlightSheetOpen(!isHighlightSheetOpen)}
              >
                <Highlighter size={16} className="mr-2" />
                Annotations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsShareViewDialogOpen(true)}>
                <ShareIcon size={16} className="mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <Trash2 size={16} className="mr-2" />
                Delete URL
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Article content container - wraps title, byline, and main content */}
        {/* Apply max-width and center horizontally */}
        {/* Added ref here for scroll height measurement */}
        <div
          ref={contentRef}
          className="max-w-[718px] mx-auto w-full pt-2 sm:pt-16 pb-16 sm:pb-24 px-2"
        >
          {/* Article Title */}
          <div className="text-center mb-3 px-2 sm:px-[40px]">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight leading-tight">
              {article.title}
            </h1>
          </div>

          {/* Byline, Source URL, Reading Time, and View Original Link */}
          <div className="text-center text-sm text-gray-500 mb-10 md:mb-12 px-2 sm:px-[40px]">
            {article.byline && (
              <span className="mr-2">By {article.byline}</span>
            )}
            {article.byline && article.url && <span className="mr-2">·</span>}
            {article.url && (
              <span className="mr-2">{getBaseUrl(article.url)}</span>
            )}
            {(article.byline || article.url) &&
              (article.content || article.excerpt) && (
                <span className="mr-2">·</span>
              )}
            {(article.content || article.excerpt) && (
              <span>
                {calculateReadingTime(article.content || article.excerpt)}
              </span>
            )}
            {article.url && (
              <div className="mt-3">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-orange-500 hover:text-orange-600 transition-colors"
                >
                  View Original
                  <ExternalLink size={16} className="ml-1" />
                </a>
              </div>
            )}
          </div>

          {/* Lead Image - Added Here */}
          {article.lead_image_url && (
            <div className="px-2 sm:px-[40px] mb-8 md:mb-10">
              <img
                src={article.lead_image_url}
                alt={article.title || "Article lead image"}
                className="w-full h-auto object-cover rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Main Article content */}
          <div
            className="max-w-none text-left px-2 sm:px-[40px] prose prose-lg prose-gray mx-auto prose-headings:font-semibold prose-headings:text-gray-800 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-a:font-medium prose-strong:text-gray-900 prose-em:text-gray-700 prose-blockquote:border-l-orange-500 prose-blockquote:text-gray-600 prose-code:text-gray-900 prose-code:bg-gray-100 prose-img:rounded-lg prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
        {/* Tagging Dialog - ADDED */}
        {article && (
          <TaggingDialog
            isOpen={isTaggingDialogOpen}
            onOpenChange={setIsTaggingDialogOpen}
            articleId={article.id}
            userId={user?.id}
          />
        )}
      </div>

      {/* Hidden HTML5 Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          style={{ display: "none" }}
          // Event listeners are added via useEffect when audioUrl changes
        />
      )}

      {/* Integrated AudioPlayerCard */}
      {isAudioPlayerVisible && article && (
        <AudioPlayerCard
          article={article}
          isPlaying={isPlayingAudio}
          isLoading={audioLoading} // Pass loading state
          onPlayPause={handlePlayPauseAudio}
          onClose={handleCloseAudioPlayer}
          onRewind={() => {
            if (audioRef.current)
              audioRef.current.currentTime = Math.max(
                0,
                audioRef.current.currentTime - 5
              );
          }}
          onFastForward={() => {
            if (audioRef.current)
              audioRef.current.currentTime = Math.min(
                duration,
                audioRef.current.currentTime + 5
              );
          }}
          onSpeedChange={(speed) => {
            setPlaybackSpeed(speed);
            if (audioRef.current) audioRef.current.playbackRate = speed;
          }}
          playbackSpeed={playbackSpeed}
          currentTime={currentTime}
          duration={duration}
          onSeek={(newTime) => {
            if (audioRef.current) {
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime); // Also update state directly for smoother UI
            }
          }}
          isMobile={isMobile}
        />
      )}

      {/* Highlights Sheet - ADDED */}
      <Sheet open={isHighlightSheetOpen} onOpenChange={setIsHighlightSheetOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "left"} // UPDATED: Sheet side based on device
          className={`w-full flex flex-col ${
            isMobile ? "h-[60vh]" : "sm:max-w-md"
          } p-0`}
        >
          <SheetHeader className="p-4 border-b">
            <SheetTitle>My Highlights</SheetTitle>
            <SheetDescription>
              Highlights from this article. Click text to scroll in article
              (future feature).
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {savedHighlights.length > 0 ? (
              savedHighlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="border-l-4 border-orange-400 p-3 rounded-r-md shadow-sm bg-white relative group"
                >
                  <div className="flex items-start">
                    <Quote
                      size={18}
                      className="text-orange-500 mr-2 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-gray-700 mb-1 italic pr-8">
                      "{highlight.text}"
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 pl-7">
                    Saved on:{" "}
                    {new Date(highlight.created_at).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-1 h-7 w-7"
                      >
                        <MoreHorizontal size={18} />
                        <span className="sr-only">Highlight options</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-1"
                      side="bottom"
                      align="end"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-2 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteHighlight(highlight.id)}
                      >
                        <Trash2 size={14} className="mr-2" /> Delete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-2 py-1.5 text-sm"
                        onClick={() =>
                          console.log("Share highlight ID:", highlight.id)
                        }
                      >
                        <ShareIcon size={14} className="mr-2" /> Share
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No highlights saved for this article yet.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Highlight Confirmation Dialog - ADDED */}
      <Dialog
        open={isDeleteHighlightDialogOpen}
        onOpenChange={setIsDeleteHighlightDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Highlight Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this highlight? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteHighlightDialogOpen(false);
                setHighlightToDeleteId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteHighlight}>
              Delete Highlight
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADDED BACK: Article Deletion Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this article? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteArticle}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog for Article View */}
      {article && (
        <ShareDialog
          isOpen={isShareViewDialogOpen}
          onOpenChange={setIsShareViewDialogOpen}
          article={article}
        />
      )}
    </>
  );
}

export default ArticleView;
