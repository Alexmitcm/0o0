import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

interface LinkProfileRequest {
  profileId: string;
}

interface LinkProfileResponse {
  success: boolean;
  data: {
    premiumProfile: {
      id: string;
      walletAddress: string;
      profileId: string;
      isActive: boolean;
      linkedAt: string;
    };
    token: string;
  };
  status: string;
}

const linkProfile = async (
  data: LinkProfileRequest
): Promise<LinkProfileResponse> => {
  const response = await fetch("/api/premium/v2/link", {
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${localStorage.getItem("backendToken") || ""}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to link profile");
  }

  return response.json();
};

export const useLinkProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkProfile,
    onError: (error: Error) => {
      console.error("Error linking profile:", error);

      // Show user-friendly error message
      const errorMessage = error.message.includes("not registered as premium")
        ? "Your wallet is not registered as premium. Please complete the registration process first."
        : error.message.includes("already linked")
          ? "This profile is already linked to another wallet."
          : error.message.includes("not owned by wallet")
            ? "This profile is not owned by your connected wallet."
            : "Failed to link profile. Please try again.";

      toast.error(errorMessage);
    },
    onSuccess: (data) => {
      // Update the access token with the new premium token
      if (data.data.token) {
        localStorage.setItem("accessToken", data.data.token);
      }

      // Invalidate and refetch premium status
      queryClient.invalidateQueries({ queryKey: ["premiumStatus"] });

      // Show success message
      toast.success("Success! Your profile is now premium.");

      // Update global Pro store if it exists
      // This would typically update a Zustand store or similar
      // For now, we'll just invalidate the relevant queries
      queryClient.invalidateQueries({ queryKey: ["userProfiles"] });
    }
  });
};
