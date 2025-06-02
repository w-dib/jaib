import React from "react";
import {
  Play,
  Pause,
  RotateCcw, // Rewind
  RotateCw, // Fast-forward
  X as XIcon, // Close
  Settings2, // Speed control
  Loader2, // Loading spinner
  Volume2, // Placeholder for volume (if added later)
  Maximize2, // Placeholder for fullscreen (if added later)
  ImageOff, // Placeholder if no image
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../../../components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { Slider } from "../../../components/ui/slider";
import { cn } from "../../../lib/utils"; // For conditional classes

// Helper to format time (MM:SS)
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const PlaybackSpeedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

function AudioPlayerCard({
  article,
  isPlaying,
  isLoading,
  onPlayPause,
  onClose,
  onRewind,
  onFastForward,
  onSpeedChange,
  playbackSpeed,
  currentTime,
  duration,
  onSeek,
  isMobile,
}) {
  const getBaseUrl = (url) => {
    try {
      const urlObject = new URL(url);
      return urlObject.hostname.replace(/^www\./, "");
    } catch {
      return "Source unknown";
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 flex justify-center", // Base positioning
        isMobile ? "" : "pointer-events-none" // Disable pointer events on container for desktop to allow clicking through
      )}
    >
      <Card
        className={cn(
          "shadow-2xl rounded-lg overflow-hidden bg-background/80 backdrop-blur-md border border-border/40",
          isMobile
            ? "w-full  max-w-full rounded-none border-t border-x-0 border-b-0" // Mobile: full width, no bottom radius, only top border
            : "w-full sm:max-w-[718px] pointer-events-auto mb-4" // Desktop: UPDATED max-width, allow pointer events
        )}
      >
        <CardHeader className={cn("p-3 sm:p-4 relative", isMobile && "pb-2")}>
          <div className="flex items-center space-x-3">
            {article?.lead_image_url ? (
              <img
                src={article.lead_image_url}
                alt={article.title || "Article image"}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <ImageOff
                  size={isMobile ? 20 : 24}
                  className="text-muted-foreground"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 pr-8 sm:pr-10">
              {" "}
              {/* ADDED pr-8 sm:pr-10 for spacing from X button */}
              <p className="text-sm sm:text-base font-semibold truncate text-foreground">
                {article?.title || "Audio Title Unknown"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {article?.site_name || getBaseUrl(article?.url)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-1 right-1 sm:top-2 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
            aria-label="Close audio player"
          >
            <XIcon size={isMobile ? 18 : 20} />
          </Button>
        </CardHeader>

        <CardContent className={cn("p-3 sm:p-4", isMobile && "pt-1 pb-2")}>
          {/* Progress Bar / Slider */}
          <div className="mb-2 sm:mb-3">
            <Slider
              value={[currentTime]}
              max={duration || 100} // Prevent NaN if duration is 0
              step={1}
              onValueChange={(value) => onSeek(value[0])}
              className={cn(
                "w-full h-2 sm:h-2.5",
                "[&_div[data-slider-track]]:bg-orange-300",
                "[&_div[data-slider-range]]:bg-orange-500"
              )}
              disabled={isLoading || !duration}
              aria-label="Audio progress"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1 sm:mt-1.5 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between">
            {/* Speed Control Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                  aria-label={`Playback speed: ${playbackSpeed}x`}
                >
                  <Settings2 size={isMobile ? 18 : 20} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1.5 rounded-md shadow-xl border bg-popover">
                <div className="flex flex-col space-y-1">
                  {PlaybackSpeedOptions.map((speed) => (
                    <Button
                      key={speed}
                      variant="ghost"
                      size="sm"
                      onClick={() => onSpeedChange(speed)}
                      className={cn(
                        "justify-start text-sm w-full px-2 py-1.5 h-auto",
                        playbackSpeed === speed &&
                          "bg-accent text-accent-foreground"
                      )}
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onRewind}
                className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground"
                disabled={isLoading || currentTime === 0}
                aria-label="Rewind 5 seconds"
              >
                <RotateCcw size={isMobile ? 20 : 22} />
              </Button>

              <Button
                variant="default" // Prominent play/pause button
                size="icon"
                onClick={onPlayPause}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-md bg-primary hover:bg-primary/90 text-primary-foreground" // Make it stand out
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <Loader2 size={isMobile ? 22 : 24} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={isMobile ? 22 : 24} />
                ) : (
                  <Play size={isMobile ? 22 : 24} />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onFastForward}
                className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground"
                disabled={isLoading || currentTime === duration}
                aria-label="Fast-forward 5 seconds"
              >
                <RotateCw size={isMobile ? 20 : 22} />
              </Button>
            </div>

            {/* Placeholder for volume or other controls, keeps spacing even */}
            <div className="h-9 w-9 sm:h-10 sm:w-10" />
          </div>
        </CardContent>
        {/* No CardFooter needed for this design to keep it sleek */}
      </Card>
    </div>
  );
}

export default AudioPlayerCard;
