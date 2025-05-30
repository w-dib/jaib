import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import {
  UploadCloud,
  X,
  Loader2,
  Gem,
  Zap,
  CheckCircle2,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";

function PocketImportBanner({ onReturnToChoice, isInsideModal }) {
  const [showUploadArea, setShowUploadArea] = useState(!!isInsideModal);
  const [fileName, setFileName] = useState(null);
  const [extractedArticlesData, setExtractedArticlesData] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [bannerVisible, setBannerVisible] = useState(true);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState(null);
  const [currentImportStatusMessage, setCurrentImportStatusMessage] =
    useState("");
  const [successfullyImportedCount, setSuccessfullyImportedCount] = useState(0);
  const [failedImportDetails, setFailedImportDetails] = useState([]);
  const [skippedImportDetails, setSkippedImportDetails] = useState([]);
  const [importCompletedThisSession, setImportCompletedThisSession] =
    useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Check localStorage on mount to see if banner should be hidden permanently
  useEffect(() => {
    if (localStorage.getItem("hidePocketImportBannerPermanently") === "true") {
      setBannerVisible(false);
    }
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    setParseError(null);
    setExtractedArticlesData([]);
    setFileName(null);
    setIsImporting(false);
    setImportProgress(0);
    setImportError(null);
    setCurrentImportStatusMessage("");
    setSuccessfullyImportedCount(0);
    setFailedImportDetails([]);
    setSkippedImportDetails([]);
    setImportCompletedThisSession(false);

    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error("Parsing errors:", results.errors);
            setParseError(
              "Error parsing CSV. Make sure it's a valid Pocket export with 'url' and 'status' columns."
            );
            return;
          }
          const requiredFields = ["url", "status", "time_added"];
          const missingFields = requiredFields.filter(
            (field) =>
              !results.meta.fields || !results.meta.fields.includes(field)
          );

          if (missingFields.length > 0) {
            console.error(
              `CSV missing required columns: ${missingFields.join(", ")}`
            );
            setParseError(
              `CSV file must contain the following columns: ${requiredFields.join(
                ", "
              )}. Missing: ${missingFields.join(", ")}.`
            );
            return;
          }

          const articles = results.data
            .map((row, index) => ({
              url: row.url,
              status: row.status,
              originalIndex: index,
              time_added: row.time_added,
            }))
            .filter(
              (article) =>
                article.url &&
                typeof article.url === "string" &&
                article.url.trim() !== "" &&
                article.status &&
                typeof article.status === "string" &&
                (article.status.toLowerCase() === "archive" ||
                  article.status.toLowerCase() === "unread") &&
                article.time_added &&
                !isNaN(parseInt(article.time_added, 10))
            );

          setExtractedArticlesData(articles);
          if (articles.length === 0) {
            setParseError(
              "No valid articles found in the CSV. Check for 'url' and 'status' (archive/unread) columns and valid entries."
            );
          }
        },
        error: (error) => {
          console.error("PapaParse error:", error);
          setParseError("Failed to parse the CSV file.");
        },
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const removeFile = () => {
    setFileName(null);
    setExtractedArticlesData([]);
    setParseError(null);
    setIsImporting(false);
    setImportProgress(0);
    setImportError(null);
    setCurrentImportStatusMessage("");
    setSuccessfullyImportedCount(0);
    setFailedImportDetails([]);
    setSkippedImportDetails([]);
    setImportCompletedThisSession(false);
  };

  const handleStartImport = async () => {
    if (!user || !extractedArticlesData.length) {
      setImportError("User not authenticated or no articles to import.");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportError(null);
    setCurrentImportStatusMessage("Starting import...");
    setSuccessfullyImportedCount(0);
    setFailedImportDetails([]);
    setSkippedImportDetails([]);
    let currentSuccessCount = 0;
    let currentFailDetails = [];
    let currentSkippedDetails = [];

    for (let i = 0; i < extractedArticlesData.length; i++) {
      const articleData = extractedArticlesData[i];
      const progress = ((i + 1) / extractedArticlesData.length) * 100;
      setCurrentImportStatusMessage(
        `Importing article ${i + 1} of ${
          extractedArticlesData.length
        }: ${articleData.url.substring(0, 50)}...`
      );
      setImportProgress(progress);

      try {
        // Step 1: Invoke Edge Function
        const { data: functionResponse, error: functionError } =
          await supabase.functions.invoke("fetch-article-data", {
            body: { url: articleData.url.trim() },
          });

        if (functionError) {
          // Network or invocation error
          console.error(
            `Error invoking Edge function for ${articleData.url}:`,
            functionError
          );
          throw {
            type: "FunctionInvocationError",
            message:
              functionError.message ||
              "Error calling the article processing service.",
            sourceUrl: articleData.url,
          };
        }

        // Check for errors returned *within* the function's JSON response
        if (functionResponse && functionResponse.error) {
          console.error(
            `Error from Edge function logic for ${articleData.url}:`,
            functionResponse.message, // Log the specific message from the function
            functionResponse // Log the whole response for more context
          );
          throw {
            type: functionResponse.error, // e.g., "ArticleProcessingError", "Invalid URL Format"
            message:
              functionResponse.message ||
              "An unknown error occurred in the article processor.",
            sourceUrl: functionResponse.sourceUrl || articleData.url,
          };
        }

        // If we reach here, functionResponse is the successfully parsed article data
        const parsedArticle = functionResponse;
        const is_read = articleData.status.toLowerCase() === "archive";

        // Convert time_added (Unix timestamp) to ISO 8601 string for Supabase
        const saved_at_iso = articleData.time_added
          ? new Date(parseInt(articleData.time_added, 10) * 1000).toISOString()
          : new Date().toISOString(); // Fallback to now() if time_added is missing/invalid

        // Step 2: Save to 'articles' table
        const { error: insertError } = await supabase.from("articles").insert({
          url: parsedArticle.url,
          title: parsedArticle.title || "Untitled",
          content: parsedArticle.content,
          excerpt: parsedArticle.excerpt,
          byline: parsedArticle.byline,
          length: parsedArticle.length,
          lead_image_url: parsedArticle.lead_image_url,
          user_id: user.id,
          is_read: is_read,
          site_name: parsedArticle.siteName || parsedArticle.site_name || null,
          saved_at: saved_at_iso, // Add the converted timestamp
        });

        if (insertError) {
          console.error(
            `Database insert error for ${parsedArticle.url}:`,
            insertError
          );
          if (insertError.code === "23505") {
            // Unique constraint violation
            throw {
              type: "DuplicateArticle",
              message: "Article already exists in your saves.",
              sourceUrl: parsedArticle.url,
            };
          } else {
            throw {
              type: "DatabaseInsertError",
              message:
                insertError.message || "Error saving article to database.",
              sourceUrl: parsedArticle.url,
            };
          }
        }
        currentSuccessCount++;
        setSuccessfullyImportedCount((prev) => prev + 1);
      } catch (error) {
        console.error(`Failed to process ${articleData.url}:`, error);
        const errorSourceUrl = error.sourceUrl || articleData.url; // Ensure we always have a URL for the error entry

        if (error.type === "DuplicateArticle") {
          currentSkippedDetails.push({
            url: errorSourceUrl,
            originalIndex: articleData.originalIndex,
            message: error.message || "Already exists.",
          });
        } else {
          // Use the specific message from the caught error if available
          let userFriendlyError =
            error.message || "An unknown processing error occurred.";

          // No need for the extensive cascading if/else for HTTP status codes here anymore,
          // as the Edge Function now returns more structured errors.
          // The `error.message` from the Edge Function (e.g., timeout, parse failure) is now the primary source.

          currentFailDetails.push({
            url: errorSourceUrl,
            originalIndex: articleData.originalIndex,
            error: userFriendlyError, // This will now contain messages like "Request to ... timed out..."
          });
        }
      }
    }
    setFailedImportDetails(currentFailDetails);
    setSkippedImportDetails(currentSkippedDetails);

    setCurrentImportStatusMessage("Import complete!");
    setImportProgress(100);
    // setIsImporting(false); // Keep true to show final stats until redirect

    // Wait a bit to show final stats then redirect
    if (!isInsideModal) {
      setTimeout(() => {
        setIsImporting(false); // Now allow UI to show final summary before redirect
        setImportCompletedThisSession(true);
        // Potentially clear file name and extracted data after successful import and redirect
        // setFileName(null);
        // setExtractedArticlesData([]);
        if (currentFailDetails.length === 0 && !importError) {
          // only redirect if all successful
          // navigate("/"); // TODO: Decide on redirect behavior based on success/failure
        }
        // If we want to always navigate or based on some condition:
        // For now, let's only navigate if there are no overall errors and some success
        if (!importError && currentSuccessCount > 0) {
          // Consider adding a small delay *before* navigating to let user see final message
          setTimeout(() => navigate("/"), 1500);
        } else if (
          !importError &&
          currentSuccessCount === 0 &&
          currentFailDetails.length > 0
        ) {
          // All failed, maybe don't navigate or show a stronger error
          setCurrentImportStatusMessage(
            "All articles failed to import. Please check details."
          );
        } else if (importError) {
          setCurrentImportStatusMessage(
            `Import process encountered an error: ${importError}`
          );
        }
      }, 1000); // Delay before setting isImporting to false and deciding on navigation
    } else {
      // If inside modal, just set importing to false and completed.
      // The "Import another CSV?" button will trigger onReturnToChoice
      setIsImporting(false);
      setImportCompletedThisSession(true);
    }
  };

  const handleDismissPermanently = (e) => {
    e.stopPropagation();
    localStorage.setItem("hidePocketImportBannerPermanently", "true");
    setBannerVisible(false);
    setShowUploadArea(false); // Also hide upload area if shown
    if (isInsideModal && onReturnToChoice) {
      onReturnToChoice(); // If in modal, also navigate back to choice
    }
  };

  const handleCloseUploadAreaAndSessionDismiss = () => {
    if (isInsideModal && onReturnToChoice) {
      onReturnToChoice(); // Go back to choice view in parent modal
    } else {
      setBannerVisible(false); // Hides for current session only
      setShowUploadArea(false); // Standard behavior if not in modal
    }
  };

  const handleBannerClick = () => {
    // This function is only relevant if not inside a modal, as the banner isn't shown in modal mode.
    if (!isInsideModal) {
      setShowUploadArea(true);
    }
  };

  if (!bannerVisible && !showUploadArea) {
    return null; // If permanently dismissed and not actively showing upload area, render nothing
  }

  // The initial small banner (to click to show upload area) is only rendered if NOT isInsideModal.
  // If isInsideModal, the component effectively starts with showUploadArea = true.
  if (!isInsideModal && !showUploadArea && bannerVisible) {
    return (
      <div
        className="bg-slate-50 border border-slate-200 text-slate-700 p-3.5 mt-4 rounded-lg flex items-center justify-between shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 max-w-max mx-auto cursor-pointer"
        role="button"
        onClick={handleBannerClick} // Use new handler
        tabIndex={0}
        onKeyPress={(e) => e.key === "Enter" && handleBannerClick()} // Use new handler
      >
        <div className="flex items-center">
          <UploadCloud
            size={20}
            className="text-orange-500 mr-3 flex-shrink-0"
          />
          <p className="text-sm">
            <span className="font-semibold text-orange-600">Click here</span> to
            import your URLs from Pocket.
          </p>
        </div>
        <TooltipProvider delayDuration={0}>
          <div className="flex items-center ml-3 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDismissPermanently}
                  className="text-slate-400 hover:text-slate-600 mr-2"
                  aria-label="Don't show again"
                >
                  <EyeOff size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Don&apos;t show again</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBannerVisible(false); // Hides for current session only
                  }}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Dismiss banner for this session"
                >
                  <X size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dismiss for this session</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    );
  }

  if (showUploadArea) {
    return (
      <div className="my-6 p-6 border border-gray-300 rounded-lg shadow-sm bg-white w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Import Pocket Articles
          </h2>
          <TooltipProvider delayDuration={0}>
            <div className="flex items-center space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismissPermanently}
                    className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Don't show Pocket Import again"
                    disabled={isImporting}
                  >
                    <EyeOff size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Don&apos;t show Pocket Import again</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseUploadAreaAndSessionDismiss} // Use the new combined handler
                    className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Close import area"
                    disabled={isImporting}
                  >
                    <X size={24} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Close Importer</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {!isImporting && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start mb-4">
              <Zap className="text-orange-500 h-10 w-10 mr-0 sm:mr-4 mb-3 sm:mb-0 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-orange-700">
                  Unlock Lightning-Fast Imports & More!
                </h3>
                <p className="text-sm text-orange-600 mt-1">
                  Upgrade to Premium and supercharge your Jaib experience.
                </p>
              </div>
            </div>

            <div className="my-4 text-sm">
              <div className="hidden sm:grid sm:grid-cols-3 sm:gap-x-4 sm:mb-2">
                <div className="font-semibold text-slate-700 pb-1 sm:text-center">
                  Feature
                </div>
                <div className="font-semibold text-slate-700 text-center pb-1">
                  Free
                </div>
                <div className="font-semibold text-orange-600 text-center pb-1">
                  Premium <Gem size={14} className="inline ml-1 mb-0.5" />
                </div>
              </div>

              <div className="space-y-3 sm:space-y-0">
                <div className="p-3 border rounded-lg bg-white sm:p-0 sm:border-0 sm:grid sm:grid-cols-3 sm:gap-x-4 sm:items-center sm:py-2 sm:border-t border-orange-100">
                  <div className="font-medium text-slate-600 mb-1 sm:mb-0 sm:border-r sm:border-gray-200 sm:text-center">
                    Articles per Import
                  </div>
                  <div className="text-slate-700 sm:text-center">
                    <span className="sm:hidden font-normal text-xs text-slate-500">
                      Free:{" "}
                    </span>
                    15
                  </div>
                  <div className="text-orange-600 font-semibold sm:text-center">
                    <span className="sm:hidden font-normal text-xs text-slate-500">
                      Premium:{" "}
                    </span>
                    1,000+
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-white sm:p-0 sm:border-0 sm:grid sm:grid-cols-3 sm:gap-x-4 sm:items-center sm:py-2 sm:border-t border-orange-100 sm:mt-2">
                  <div className="font-medium text-slate-600 mb-1 sm:mb-0 sm:border-r sm:border-gray-200 sm:text-center">
                    Bulk Tagging & Organizing
                  </div>
                  <div className="text-slate-400 sm:text-center">
                    <span className="sm:hidden font-normal text-xs text-slate-500">
                      Free:{" "}
                    </span>
                    ✕
                  </div>
                  <div className="text-orange-600 font-semibold sm:text-center">
                    <span className="sm:hidden font-normal text-xs text-slate-500">
                      Premium:{" "}
                    </span>
                    ✓
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-white sm:p-0 sm:border-0 sm:grid sm:grid-cols-3 sm:gap-x-4 sm:items-center sm:py-2 sm:border-t border-orange-100 sm:mt-2">
                  <div className="font-medium text-slate-600 mb-1 sm:mb-0 sm:border-r sm:border-gray-200 sm:text-center">
                    Advanced Search & Filtering
                  </div>
                  <div className="text-slate-700 sm:text-center">
                    <span className="sm:hidden font-normal text-xs text-slate-500">
                      Free:{" "}
                    </span>
                    Basic
                  </div>
                  <div className="text-orange-600 font-semibold sm:text-center">
                    <span className="sm:hidden font-normal text-xs text-slate-500">
                      Premium:{" "}
                    </span>
                    Enhanced
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => alert("Upgrade to Premium clicked!")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg text-base transition-colors shadow-sm hover:shadow-md mt-4"
            >
              Upgrade to Premium
            </Button>
          </div>
        )}

        {!isImporting && !importCompletedThisSession && (
          <>
            <div
              {...getRootProps()}
              className={`p-8 border-2 border-dashed rounded-md text-center cursor-pointer
                      ${
                        isDragActive
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-300 hover:border-gray-400"
                      }
                      transition-colors`}
            >
              <input {...getInputProps()} />
              <UploadCloud size={48} className="mx-auto text-gray-400 mb-3" />
              {fileName ? (
                <div>
                  <p className="text-gray-700">File: {fileName}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="mt-2 text-sm text-red-500 hover:text-red-700"
                  >
                    Remove file
                  </button>
                </div>
              ) : isDragActive ? (
                <p className="text-orange-600">Drop the .csv file here ...</p>
              ) : (
                <p className="text-gray-500">
                  Drop your Pocket .csv file here, or click to select.
                </p>
              )}
            </div>

            {parseError && (
              <p className="mt-3 text-sm text-red-600">{parseError}</p>
            )}
          </>
        )}

        {extractedArticlesData.length > 0 &&
          !isImporting &&
          !parseError &&
          !importCompletedThisSession && (
            <div className="mt-6 text-center">
              <p className="text-lg text-green-700 mb-2">
                Found {extractedArticlesData.length} article(s) ready for
                import.
              </p>
              <button
                onClick={handleStartImport}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md text-lg shadow-md transition-colors flex items-center justify-center mx-auto"
              >
                Start Import
              </button>
            </div>
          )}

        {isImporting && (
          <div className="mt-6 w-full">
            <p className="text-center text-orange-600 mb-2 font-semibold">
              {currentImportStatusMessage}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
              <div
                className="bg-orange-500 h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-500">
              {importProgress.toFixed(0)}%
            </p>
            {/* Warning message about not closing the page */}
            <div className="mt-3 flex items-center justify-center text-red-600">
              <AlertTriangle size={20} className="mr-2" />
              <p className="text-sm font-semibold">
                Please do not close this page while the import is in progress.
              </p>
            </div>
          </div>
        )}

        {/* New Combined DONE state and Statistics Display */}
        {!isImporting && importCompletedThisSession && (
          <div className="mt-6 text-center">
            {" "}
            {/* Main container for DONE state */}
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 size={48} className="text-orange-500 mr-3" />
              <h2 className="text-3xl font-bold text-orange-500">DONE!</h2>
            </div>
            {/* Import Statistics - Placed *inside* the 'importCompletedThisSession' block */}
            {(successfullyImportedCount > 0 ||
              failedImportDetails.length > 0 ||
              skippedImportDetails.length > 0) && (
              <div className="mt-4 mb-6 text-sm">
                {" "}
                {/* Added some margin for spacing */}
                {successfullyImportedCount > 0 && (
                  <p className="text-green-600">
                    Successfully imported {successfullyImportedCount}{" "}
                    article(s).
                  </p>
                )}
                {skippedImportDetails.length > 0 && (
                  <div className="mt-2">
                    <p className="text-blue-600">
                      Skipped {skippedImportDetails.length} article(s) (already
                      exist):
                    </p>
                    <ul className="list-disc list-inside max-h-32 overflow-y-auto text-xs text-blue-500">
                      {skippedImportDetails.map((skip, index) => (
                        <li key={index}>
                          Original row {skip.originalIndex + 2}:{" "}
                          <a
                            href={skip.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {skip.url.substring(0, 50)}...
                          </a>{" "}
                          - {skip.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {failedImportDetails.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-600">
                      Failed to import {failedImportDetails.length} article(s):
                    </p>
                    <ul className="list-disc list-inside max-h-32 overflow-y-auto text-xs text-red-500">
                      {failedImportDetails.map((fail, index) => (
                        <li key={index}>
                          Original row {fail.originalIndex + 2}:{" "}
                          <a
                            href={fail.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {fail.url.substring(0, 50)}...
                          </a>{" "}
                          - {fail.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {importError && (
                  <p className="mt-2 text-red-600">
                    Overall import error: {importError}
                  </p>
                )}
              </div>
            )}
            <Button
              onClick={() => {
                if (isInsideModal && onReturnToChoice) {
                  removeFile(); // Still reset local state
                  onReturnToChoice();
                } else {
                  removeFile(); // Standard behavior
                }
              }}
              className="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md text-lg shadow-md transition-colors"
            >
              Import another .csv?
            </Button>
          </div>
        )}

        {/* Only show "Not sure how to export?" if we are in a state to accept a new file */}
        {!isImporting && !importCompletedThisSession && (
          <div className="mt-6 text-sm text-center">
            <p className="text-gray-600">
              Not sure how to export your pocket articles?{" "}
              <a
                href="https://support.mozilla.org/en-US/kb/future-of-pocket#w_how-to-export-your-saved-articles"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-600 underline"
              >
                Click here.
              </a>
            </p>
          </div>
        )}
      </div>
    );
  }
}

export default PocketImportBanner;
