import { PROMPT_STRATEGIES } from "../../lib/constants/prompts";

interface PromptStrategyPreset {
  name: string;
  icon: string;
  description: string;
  distribution: Record<string, number>;
}

interface PromptStrategySelectorProps {
  selectedStrategy?: string;
  currentStrategy?: string;
  onStrategySelect?: (strategyKey: string) => void;
  onStrategyChange?: (strategyKey: string) => void;
  disabled?: boolean;
}

export function PromptStrategySelector({
  selectedStrategy,
  currentStrategy,
  onStrategySelect,
  onStrategyChange,
  disabled = false,
}: PromptStrategySelectorProps) {
  const activeStrategy = currentStrategy || selectedStrategy || "balanced";
  const handleSelect = onStrategyChange || onStrategySelect || (() => {});
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(PROMPT_STRATEGIES).map(([key, strategy]) => (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              activeStrategy === key
                ? "border-primary-500 bg-primary-500/10"
                : "border-border hover:border-primary-500/50 bg-card"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{strategy.icon}</span>
              <h3 className="font-semibold">{strategy.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {strategy.description}
            </p>
            <div className="mt-3 space-y-1">
              {Object.entries(strategy.distribution).map(([category, value]) => (
                <div key={category} className="flex items-center gap-2 text-xs">
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full"
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8">
                    {Math.round(value * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
