import type { AIProvider, InputType } from "../types";

interface ProviderSelectProps {
  selectedProvider: AIProvider;
  inputType: InputType;
  onProviderChange: (provider: AIProvider) => void;
  disabled?: boolean;
}

const providerData: Record<
  AIProvider,
  {
    name: string;
    description: string;
    supportsVideo: boolean;
    iconColor: string;
  }
> = {
  gemini: {
    name: "GEMINI FLASH",
    description: "Fast analysis, video support",
    supportsVideo: true,
    iconColor: "text-primary-500",
  },
  claude: {
    name: "CLAUDE SONNET",
    description: "Precise analysis",
    supportsVideo: false,
    iconColor: "text-accent-red",
  },
};

const providers: AIProvider[] = ["gemini", "claude"];

export default function ProviderSelect({
  selectedProvider,
  inputType,
  onProviderChange,
  disabled,
}: ProviderSelectProps) {
  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      {/* Label */}
      <p className="text-[10px] font-bold text-gray-600 tracking-[0.2em] uppercase mb-2">
        AI Provider
      </p>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {providers.map((p) => {
          const data = providerData[p];
          const isSelected = selectedProvider === p;
          const isDisabled = inputType === "video" && !data.supportsVideo;

          return (
            <button
              key={p}
              onClick={() => !isDisabled && onProviderChange(p)}
              disabled={isDisabled}
              className={`
                relative p-3 rounded-sm text-left transition-all duration-200
                border
                ${isSelected
                  ? "border-primary-500 bg-white/5"
                  : "border-white/5 bg-white/5 hover:border-white/20"
                }
                ${isDisabled ? "opacity-30 grayscale cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div
                  className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-primary-500"
                  style={{
                    boxShadow: "0 0 10px rgba(234, 179, 8, 0.8)",
                  }}
                />
              )}

              {/* Icon + Name */}
              <div className="flex items-center gap-2 mb-2">
                {/* Icon */}
                <div className={`transition-transform ${isSelected ? "scale-110" : ""}`}>
                  {p === "gemini" ? (
                    /* Gemini 스파클 로고 */
                    <svg
                      className={`w-6 h-6 ${data.iconColor}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z" />
                    </svg>
                  ) : (
                    /* Claude 로고 - 둥근 얼굴 형태 */
                    <svg
                      className={`w-6 h-6 ${data.iconColor}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" fillOpacity="0.15" />
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="9" cy="10" r="1.5" />
                      <circle cx="15" cy="10" r="1.5" />
                      <path d="M8 15c1.5 2 6.5 2 8 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>

                {/* Provider Name */}
                <span className="text-xs font-bold text-white tracking-widest uppercase">
                  {data.name}
                </span>
              </div>

              {/* Description */}
              <p className="text-[10px] text-gray-600 mb-2">{data.description}</p>

              {/* Support Badge */}
              {data.supportsVideo ? (
                <span className="inline-block text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-sm border border-primary-500/30 text-primary-500">
                  Video Support
                </span>
              ) : (
                <span className="inline-block text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-sm border border-white/10 text-gray-600">
                  Images Only
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
