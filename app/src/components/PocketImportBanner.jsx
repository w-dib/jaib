import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import {
  UploadCloud,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  ArrowRight,
  Lock,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Link } from "react-router-dom";

function PocketImportBanner() {
  const [fileName, setFileName] = useState(null);
  const [extractedArticlesData, setExtractedArticlesData] = useState([]);
  const [parseError, setParseError] = useState(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentImportStatusMessage, setCurrentImportStatusMessage] =
    useState("");
  const [successfullyImportedCount, setSuccessfullyImportedCount] = useState(0);
  const [failedImportDetails, setFailedImportDetails] = useState([]);
  const [skippedImportDetails, setSkippedImportDetails] = useState([]);
  const [importCompletedThisSession, setImportCompletedThisSession] =
    useState(false);

  const { user } = useAuth();

  // --- Mock User Plan & Usage Data (for UI demonstration) ---
  // In a real app, this would come from user profile/subscription state
  const isPremiumUser = false; // TOGGLE THIS to see different UI
  const freePlanTotalAllowance = 50;
  const articlesImportedByFreeUser = 10; // Example count
  const premiumDailyLimit = 1000;
  // --- End Mock Data ---

  const onDrop = useCallback((acceptedFiles) => {
    setParseError(null);
    setExtractedArticlesData([]);
    setFileName(null);
    setIsImporting(false);
    setImportProgress(0);
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
              "Error parsing CSV. Please ensure it is a valid CSV file."
            );
            return;
          }
          const requiredFields = ["url"];
          const hasStatus =
            results.meta.fields && results.meta.fields.includes("status");
          const hasTimeAdded =
            results.meta.fields && results.meta.fields.includes("time_added");
          const hasIsFavorite =
            results.meta.fields && results.meta.fields.includes("is_favorite");

          const missingFields = requiredFields.filter(
            (field) =>
              !results.meta.fields || !results.meta.fields.includes(field)
          );

          if (missingFields.length > 0) {
            setParseError(
              `CSV file must contain at least the 'url' column. Missing: ${missingFields.join(
                ", "
              )}.`
            );
            return;
          }

          const articles = results.data
            .map((row, index) => {
              let status = "unread";
              if (hasStatus && row.status && typeof row.status === "string") {
                const lowerStatus = row.status.toLowerCase();
                if (lowerStatus === "archive" || lowerStatus === "unread") {
                  status = lowerStatus;
                }
              }

              let time_added = null;
              if (
                hasTimeAdded &&
                row.time_added &&
                !isNaN(parseInt(row.time_added, 10))
              ) {
                time_added = row.time_added;
              }

              return {
                url: row.url,
                status: status,
                originalIndex: index,
                time_added: time_added,
                ...(hasIsFavorite && { is_favorite: row.is_favorite }),
              };
            })
            .filter(
              (article) =>
                article.url &&
                typeof article.url === "string" &&
                article.url.trim() !== ""
            );

          setExtractedArticlesData(articles);
          if (articles.length === 0) {
            setParseError(
              "No valid article URLs found in the CSV. Ensure the 'url' column has valid entries."
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
    setCurrentImportStatusMessage("");
    setSuccessfullyImportedCount(0);
    setFailedImportDetails([]);
    setSkippedImportDetails([]);
    setImportCompletedThisSession(false);
  };

  const handleStartImport = async () => {
    if (!user || !extractedArticlesData.length) {
      setParseError(
        "User not authenticated or no articles to import. Please log in and select a file."
      );
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setCurrentImportStatusMessage("Preparing import..."); // Initial message
    setSuccessfullyImportedCount(0);
    setFailedImportDetails([]);
    setSkippedImportDetails([]);
    let currentFailDetails = [];
    let currentSkippedDetails = [];

    for (let i = 0; i < extractedArticlesData.length; i++) {
      const articleData = extractedArticlesData[i];
      const uiProgress = ((i + 1) / extractedArticlesData.length) * 100;
      setCurrentImportStatusMessage(
        `Importing article ${i + 1} of ${
          extractedArticlesData.length
        }: ${articleData.url.substring(0, 60)}...`
      );
      setImportProgress(uiProgress);

      try {
        const { data: functionResponse, error: functionError } =
          await supabase.functions.invoke("fetch-article-data", {
            body: { url: articleData.url.trim() },
          });

        if (functionError) {
          throw {
            type: "FunctionInvocationError",
            message: functionError.message || "Error calling article service.",
            sourceUrl: articleData.url,
          };
        }

        if (functionResponse && functionResponse.error) {
          throw {
            type: functionResponse.error,
            message: functionResponse.message || "Article processor error.",
            sourceUrl: functionResponse.sourceUrl || articleData.url,
          };
        }

        const parsedArticle = functionResponse;
        const is_read = articleData.status.toLowerCase() === "archive";
        const saved_at_iso = articleData.time_added
          ? new Date(parseInt(articleData.time_added, 10) * 1000).toISOString()
          : new Date().toISOString();

        let is_favorite_bool = false;
        if (articleData.is_favorite) {
          const favValue = String(articleData.is_favorite).toLowerCase();
          if (favValue === "true" || favValue === "1" || favValue === "yes") {
            is_favorite_bool = true;
          }
        }

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
          saved_at: saved_at_iso,
          is_favorite: is_favorite_bool,
        });

        if (insertError) {
          if (insertError.code === "23505") {
            currentSkippedDetails.push({
              url: parsedArticle.url,
              reason: "Article already exists (URL duplicate).",
            });
            setSkippedImportDetails([...currentSkippedDetails]);
          } else {
            throw {
              type: "DatabaseInsertError",
              message: insertError.message || "Error saving to database.",
              sourceUrl: parsedArticle.url,
            };
          }
        } else {
          setSuccessfullyImportedCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error(
          `Failed to import ${articleData.url}:`,
          err.type,
          err.message
        );
        currentFailDetails.push({
          url: articleData.url,
          reason: `${err.type || "ImportError"}: ${err.message}`,
        });
        setFailedImportDetails([...currentFailDetails]);
      }
    }
    setCurrentImportStatusMessage("Import process completed.");
    setIsImporting(false);
    setImportCompletedThisSession(true);
  };

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-lg shadow-xl border border-gray-200">
      {/* --- Usage Limits & Premium CTA Section --- */}
      {!isImporting && !importCompletedThisSession && (
        <>
          {isPremiumUser ? (
            <div className="mx-auto max-w-xl mb-6 p-5 bg-blue-50 border border-blue-200 rounded-xl shadow-sm text-sm">
              <div className="flex items-center">
                <Sparkles
                  size={22}
                  className="mr-3 text-blue-500 flex-shrink-0"
                />
                <div>
                  <p className="font-semibold text-blue-800">
                    You're on Jaib Premium!
                  </p>
                  <p className="mt-0.5 text-blue-600">
                    You can import up to {premiumDailyLimit.toLocaleString()}{" "}
                    articles per day.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-xl mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 sm:p-6 shadow-sm text-left">
              <div className="flex items-center">
                <Lock
                  size={18}
                  className="mr-1.5 text-orange-500 flex-shrink-0"
                />
                <p className="text-sm text-orange-900 font-semibold">
                  Jaib Free Plan Limit
                </p>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                You've imported{" "}
                <span className="font-medium text-slate-800">
                  {articlesImportedByFreeUser} of {freePlanTotalAllowance}
                </span>{" "}
                articles.
              </p>
              <div className="mt-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Want to unlock unlimited imports, text-to-speech, and more?{" "}
                  <Link
                    to="/pricing"
                    className="inline-flex items-center whitespace-nowrap rounded-md bg-orange-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1"
                  >
                    Go Premium
                  </Link>
                </p>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  It's instant, affordable, and built for power readers.
                </p>
              </div>
            </div>
          )}
        </>
      )}
      {/* --- End Usage Limits & Premium CTA Section --- */}

      {!isImporting && !importCompletedThisSession && (
        <div className="mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
            Import your Pocket CSV Export
          </h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto mb-6">
            To import from Pocket, first export your data from Pocket as a CSV
            file. Then, drop that CSV file here or click to select it.
          </p>
        </div>
      )}

      {!fileName && !isImporting && !importCompletedThisSession && (
        <div
          {...getRootProps()}
          className={`mx-auto max-w-xl border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-colors duration-200 ease-in-out ${
            isDragActive
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud
            className="mx-auto h-12 w-12 text-gray-400 mb-3"
            aria-hidden="true"
          />
          <p className="text-lg font-semibold text-gray-700 mb-1">
            Drop your Pocket CSV file here
          </p>
          <p className="text-sm text-gray-500 mb-3">or click to select</p>
          <Button
            type="button"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md text-sm shadow-sm"
          >
            Select CSV File
          </Button>
          <p className="mt-3 text-xs text-gray-400">
            Max file size: 5MB. Supported format: .csv
          </p>
        </div>
      )}

      {parseError && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
          <AlertTriangle className="inline h-5 w-5 mr-2" /> {parseError}
        </div>
      )}

      {fileName &&
        !isImporting &&
        !importCompletedThisSession &&
        extractedArticlesData.length > 0 &&
        !parseError && (
          <div className="mt-6 text-center">
            <p className="text-lg text-green-700 mb-1">
              <CheckCircle2 className="inline h-5 w-5 mr-1 text-green-600" />
              Ready to import: <strong>{fileName}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Found {extractedArticlesData.length} article(s).
            </p>
            <div className="flex justify-center items-center space-x-3">
              <Button
                onClick={handleStartImport}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-md text-base shadow-md"
                disabled={isImporting}
              >
                <UploadCloud size={18} className="mr-2" /> Start Import
              </Button>
              <Button
                variant="outline"
                onClick={removeFile}
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
                disabled={isImporting}
              >
                <X size={18} className="mr-1.5" /> Remove File
              </Button>
            </div>
          </div>
        )}

      {(isImporting || importCompletedThisSession) && (
        <div className="mt-8 w-full">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            {isImporting ? "Importing Articles..." : "Import Results"}
          </h3>

          {isImporting && (
            <div className="text-center mb-6">
              <p className="text-sm text-orange-600 mb-1">
                {currentImportStatusMessage}
              </p>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 my-2 shadow-inner overflow-hidden">
                <div
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-200 ease-linear"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-4">
                <span>{Math.round(importProgress)}% complete</span>
              </div>

              {/* Warning Message */}
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md flex items-center justify-center text-sm">
                <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                Please keep this page open until the import is complete.
              </div>
            </div>
          )}

          {importCompletedThisSession && (
            <div className="space-y-4 mt-6">
              {successfullyImportedCount > 0 && (
                <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-md">
                  <CheckCircle2 className="inline h-5 w-5 mr-2" />
                  Successfully imported {successfullyImportedCount} article(s).
                </div>
              )}
              {failedImportDetails.length > 0 && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
                  <h4 className="font-semibold mb-2">
                    <AlertTriangle className="inline h-5 w-5 mr-2" />
                    Failed to import {failedImportDetails.length} article(s):
                  </h4>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {failedImportDetails.map((fail, index) => (
                      <li key={index}>
                        <strong>{fail.url}</strong>: {fail.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {skippedImportDetails.length > 0 && (
                <div className="p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md">
                  <h4 className="font-semibold mb-2">
                    Skipped {skippedImportDetails.length} article(s):
                  </h4>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {skippedImportDetails.map((skip, index) => (
                      <li key={index}>
                        <strong>{skip.url}</strong>: {skip.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-6 text-center">
                <Button onClick={removeFile} variant="outline">
                  Import Another File
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PocketImportBanner;
