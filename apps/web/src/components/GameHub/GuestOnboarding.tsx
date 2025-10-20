import { useState } from "react";
import { Button } from "@/components/Shared/UI/Button";

interface GuestOnboardingProps {
  onComplete: () => void;
  className?: string;
}

const GuestOnboarding = ({
  onComplete,
  className = ""
}: GuestOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      description:
        "Play amazing games and earn rewards. Start as a guest or create an account for full access.",
      features: [
        "Play free games instantly",
        "No registration required",
        "Limited features available"
      ],
      icon: "🎮",
      title: "Welcome to GameHub!"
    },
    {
      description: "As a guest, you can play free games with some limitations.",
      features: [
        "2 minutes per game session",
        "Access to free games only",
        "No progress saving",
        "No rewards or tournaments"
      ],
      icon: "⏰",
      title: "Guest Mode Features"
    },
    {
      description:
        "Unlock the full potential of GameHub with a premium account.",
      features: [
        "Unlimited play time",
        "100+ Premium games",
        "Earn real USDT rewards",
        "Join exclusive tournaments",
        "Full progress tracking"
      ],
      icon: "⭐",
      title: "Upgrade Benefits"
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleGetStarted = () => {
    onComplete();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 ${className}`}
    >
      <div className="w-full max-w-2xl rounded-lg bg-gray-900 p-6">
        <div className="text-center">
          <div className="mb-6 text-6xl">{currentStepData.icon}</div>
          <h2 className="mb-4 font-bold text-3xl text-white">
            {currentStepData.title}
          </h2>
          <p className="mb-8 text-gray-300 text-lg">
            {currentStepData.description}
          </p>

          {/* Features List */}
          <div className="mb-8 space-y-3">
            {currentStepData.features.map((feature, index) => (
              <div className="flex items-center gap-3 text-left" key={index}>
                <div className="text-green-400">✓</div>
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="mb-8 flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                className={`h-2 w-8 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-purple-500"
                    : index < currentStep
                      ? "bg-green-500"
                      : "bg-gray-600"
                }`}
                key={index}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {currentStep === steps.length - 1 ? (
              <Button
                className="w-full sm:w-auto"
                onClick={handleGetStarted}
                size="lg"
                variant="primary"
              >
                Get Started
              </Button>
            ) : (
              <>
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleNext}
                  size="lg"
                  variant="primary"
                >
                  Next
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleSkip}
                  size="lg"
                  variant="ghost"
                >
                  Skip Tour
                </Button>
              </>
            )}
          </div>

          {/* Step Navigation */}
          {currentStep > 0 && (
            <button
              className="mt-4 text-gray-400 text-sm hover:text-white"
              onClick={() => setCurrentStep(currentStep - 1)}
              type="button"
            >
              ← Previous
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestOnboarding;
