import { useDropzone } from "react-dropzone";
import { FormLabel } from "./form";
import { cn } from "@/lib/utils";
import { Label } from "./label";

/**
 * Props for the ResumeDropzone component.
 */
type ResumeDropzoneProps = {
    /** Current file array value */
    value: File[];
    /** Callback when files are selected or dropped */
    onChange: (files: File[]) => void;
    /** Validation error message, if any */
    error?: string | null;
    /** Whether the dropzone is disabled */
    disabled: boolean;
  };
  
  /**
   * Dropzone component for uploading resume files.
   * Accepts PDF, DOC, and DOCX formats up to 5MB.
   * 
   * @param props - Component props
   */
  const ResumeDropzone: React.FC<ResumeDropzoneProps> = ({ value, onChange, disabled, error }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (acceptedFiles) => onChange(acceptedFiles),
      accept: {
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      },
      maxSize: 5 * 1024 * 1024,
      multiple: false,
      disabled,
    });
  
    const file = value?.[0] ?? null;
  
    return (
      <div className="w-full max-w-[1008px]">
        <FormLabel>
          Resume<span className="text-red-500 py-1">*</span>
        </FormLabel>
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center p-6 bg-white dark:bg-black/40 w-full h-48 sm:h-56 lg:h-[255px] border-2 border-dashed rounded-[10px] cursor-pointer transition-colors",
            error ? "border-red-500" : "border-gray-300",
            isDragActive && "bg-gray-100",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <Label className="text-gray-500 dark:text-white font-lato">
              {disabled
                ? "Form is submitting..."
                : isDragActive
                ? "Drop the file here..."
                : <p>Drop your resume here, <span className="text-red-500">or click here to browse</span></p>}
            </Label>
            <p className="text-xs text-gray-400 mt-1">
              (Accepted formats: .pdf, .doc, .docx | Max size: 2MB)
            </p>
            {file && (
              <p className="mt-2 text-sm font-semibold text-green-600">
                Selected file: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  };

export default ResumeDropzone;