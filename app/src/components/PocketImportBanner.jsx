import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { UploadCloud, X, AlertTriangle } from "lucide-react";

function PocketImportBanner() {
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [extractedUrls, setExtractedUrls] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [bannerVisible, setBannerVisible] = useState(true);

  const onDrop = useCallback((acceptedFiles) => {
    setParseError(null);
    setExtractedUrls([]);
    setFileName(null);

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
              "Error parsing CSV. Make sure it's a valid Pocket export."
            );
            return;
          }
          if (!results.meta.fields || !results.meta.fields.includes("url")) {
            console.error("CSV missing 'url' column");
            setParseError("CSV file must contain a 'url' column.");
            return;
          }
          const urls = results.data
            .map((row) => row.url)
            .filter(
              (url) => url && typeof url === "string" && url.trim() !== ""
            );
          setExtractedUrls(urls);
          // For now, we'll log them. Later, you can trigger the import process.
          console.log("Extracted URLs:", urls);
          if (urls.length === 0) {
            setParseError("No URLs found in the 'url' column of the CSV.");
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
    setExtractedUrls([]);
    setParseError(null);
  };

  if (!bannerVisible) {
    if (!showUploadArea) {
      return null;
    }
  } else if (!showUploadArea) {
    return (
      <div
        className="bg-orange-100 text-orange-500 p-4 my-4 rounded-md flex items-center justify-between shadow-md w-full"
        role="alert"
      >
        <div
          className="flex-grow flex items-center cursor-pointer mr-3"
          onClick={() => setShowUploadArea(true)}
        >
          <AlertTriangle
            size={20}
            className="mr-3 text-orange-500 flex-shrink-0"
          />
          <p className="text-sm">
            Pocket is shutting down ·{" "}
            <span className="font-bold">Click here</span> to import your Pocket
            articles to continue enjoying them with Jaib.
          </p>
        </div>
        <button
          onClick={() => setBannerVisible(false)}
          className="text-orange-500 hover:text-orange-700 flex-shrink-0"
          aria-label="Dismiss banner"
        >
          <X size={18} />
        </button>
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
          <button
            onClick={() => setShowUploadArea(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close import area"
          >
            <X size={24} />
          </button>
        </div>

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

        {extractedUrls.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-green-600">
              Successfully extracted {extractedUrls.length} URL(s). Ready for
              import.
            </p>
            {/* Later, you can add a button here to start the actual import to Supabase */}
            {/* 
            <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-gray-500">
              {extractedUrls.map((url, index) => <li key={index}>{url}</li>)}
            </ul> 
            */}
          </div>
        )}

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
      </div>
    );
  }
}

export default PocketImportBanner;
