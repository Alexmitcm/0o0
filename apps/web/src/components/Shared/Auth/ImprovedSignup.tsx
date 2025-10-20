import {
  CheckIcon,
  ExclamationTriangleIcon,
  FaceFrownIcon,
  FaceSmileIcon
} from "@heroicons/react/24/outline";
import { HEY_APP, IS_MAINNET } from "@hey/data/constants";
import { ERRORS } from "@hey/data/errors";
import { Regex } from "@hey/data/regex";
import {
  useAccountQuery,
  useAuthenticateMutation,
  useChallengeMutation,
  useCreateAccountWithUsernameMutation
} from "@hey/indexer";
import { account as accountMetadata } from "@lens-protocol/metadata";
import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { z } from "zod";
import { Button, Card, Form, Input, useZodForm } from "@/components/Shared/UI";
import errorToast from "@/helpers/errorToast";
import uploadMetadata from "@/helpers/uploadMetadata";
import useHandleWrongNetwork from "@/hooks/useHandleWrongNetwork";
import useTransactionLifecycle from "@/hooks/useTransactionLifecycle";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import ImprovedWalletSelector from "./ImprovedWalletSelector";

const ValidationSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(26, { message: "Username must be at most 26 characters long" })
    .regex(Regex.username, {
      message:
        "Username must start with a letter/number, only _ allowed in between"
    })
});

const WelcomeMessage = () => (
  <div className="space-y-3 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
      <span className="text-2xl">🚀</span>
    </div>
    <div>
      <h2 className="font-bold text-gray-900 text-xl dark:text-white">
        Welcome to Hey!
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Let's create your unique Lens profile
      </p>
    </div>
  </div>
);

const ImprovedSignup = () => {
  const { address, connector: activeConnector } = useAccount();
  const { setShowAuthModal } = useAuthModalStore();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupStep, setSignupStep] = useState<
    "username" | "challenge" | "signature" | "creating" | "success"
  >("username");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chosenUsername, setChosenUsername] = useState<string>("");

  const form = useZodForm({ mode: "onChange", schema: ValidationSchema });
  const handleWrongNetwork = useHandleWrongNetwork();
  const handleTransactionLifecycle = useTransactionLifecycle();

  const { signMessageAsync } = useSignMessage();
  const [loadChallenge] = useChallengeMutation();
  const [authenticate] = useAuthenticateMutation();

  const onError = (error?: any) => {
    setIsSubmitting(false);
    setSignupStep("username");

    let errorMsg = "Signup failed. Please try again.";
    if (error?.message) {
      if (error.message.includes("User rejected")) {
        errorMsg =
          "Please approve the signature request in your wallet to continue.";
      } else if (error.message.includes("UsernameTaken")) {
        errorMsg =
          "This username is already taken. Please choose a different one.";
      } else if (error.message.includes("network")) {
        errorMsg = "Network error. Please check your connection and try again.";
      }
    }

    setErrorMessage(errorMsg);
    setTimeout(() => setErrorMessage(null), 5000);
    errorToast(error);
  };

  const onCompleted = (_hash: string) => {
    setSignupStep("success");
    setIsSubmitting(false);
    setTimeout(() => {
      setShowAuthModal(false);
    }, 2000);
  };

  const [createAccountWithUsername] = useCreateAccountWithUsernameMutation({
    onCompleted: async ({ createAccountWithUsername }) => {
      if (createAccountWithUsername.__typename === "CreateAccountResponse") {
        return onCompleted(createAccountWithUsername.hash);
      }

      if (createAccountWithUsername.__typename === "UsernameTaken") {
        return onError({ message: createAccountWithUsername.reason });
      }

      return await handleTransactionLifecycle({
        onCompleted,
        onError,
        transactionData: createAccountWithUsername
      });
    },
    onError
  });

  const username = form.watch("username");
  const canCheck = Boolean(username && username.length > 2);

  // Check username availability
  useAccountQuery({
    fetchPolicy: "no-cache",
    onCompleted: (data) => setIsAvailable(!data.account),
    skip: !canCheck,
    variables: {
      request: { username: { localName: username?.toLowerCase() } }
    }
  });

  const handleSignup = async ({
    username
  }: z.infer<typeof ValidationSchema>) => {
    try {
      setIsSubmitting(true);
      setSignupStep("challenge");
      setErrorMessage(null);
      setChosenUsername(username);
      await handleWrongNetwork();

      // Get challenge
      const challenge = await loadChallenge({
        variables: {
          request: {
            onboardingUser: {
              app: IS_MAINNET ? HEY_APP : undefined,
              wallet: address
            }
          }
        }
      });

      if (!challenge?.data?.challenge?.text) {
        return onError({ message: ERRORS.SomethingWentWrong });
      }

      setSignupStep("signature");
      // Get signature
      const signature = await signMessageAsync({
        message: challenge?.data?.challenge?.text
      });

      setSignupStep("creating");
      // Auth account
      const auth = await authenticate({
        variables: { request: { id: challenge.data.challenge.id, signature } }
      });

      if (auth.data?.authenticate.__typename === "AuthenticationTokens") {
        const accessToken = auth.data?.authenticate.accessToken;
        const metadataUri = await uploadMetadata(
          accountMetadata({ name: username })
        );

        return await createAccountWithUsername({
          context: { headers: { Authorization: `Bearer ${accessToken}` } },
          variables: {
            request: {
              metadataUri,
              username: { localName: username.toLowerCase() }
            }
          }
        });
      }

      return onError({ message: ERRORS.SomethingWentWrong });
    } catch {
      onError();
    }
  };

  const disabled =
    !canCheck || !isAvailable || isSubmitting || !form.formState.isValid;

  if (!activeConnector?.id) {
    return (
      <div className="space-y-6">
        <WelcomeMessage />
        <ImprovedWalletSelector showHelpText={true} />
      </div>
    );
  }

  if (signupStep === "success") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-xl dark:text-white">
            Welcome to Hey, @{chosenUsername}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your profile has been created successfully
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeMessage />

      {/* Error Display */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-400" />
            <div className="text-red-700 text-sm dark:text-red-300">
              {errorMessage}
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {isSubmitting && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 animate-spin text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="text-blue-700 text-sm dark:text-blue-300">
              {signupStep === "challenge" &&
                "Generating authentication challenge..."}
              {signupStep === "signature" &&
                "Please sign the message in your wallet..."}
              {signupStep === "creating" && "Creating your profile..."}
            </div>
          </div>
        </div>
      )}

      {/* Username Form */}
      <Card className="p-6">
        <Form
          className="space-y-4"
          form={form}
          onSubmit={async ({ username }) =>
            await handleSignup({ username: username.toLowerCase() })
          }
        >
          <div>
            <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
              Choose your username
            </label>
            <Input
              placeholder="yourusername"
              prefix="@lens/"
              {...form.register("username")}
              disabled={isSubmitting}
            />

            {/* Username Status */}
            {canCheck && !form.formState.errors.username ? (
              isAvailable === false ? (
                <div className="mt-2 flex items-center space-x-1 text-red-500 text-sm">
                  <FaceFrownIcon className="size-4" />
                  <span>Username not available!</span>
                </div>
              ) : isAvailable === true ? (
                <div className="mt-2 flex items-center space-x-1 text-green-500 text-sm">
                  <CheckIcon className="size-4" />
                  <span>Great! This username is available</span>
                </div>
              ) : null
            ) : canCheck && form.formState.errors.username ? (
              <div className="mt-2 flex items-center space-x-1 text-red-500 text-sm">
                <ExclamationTriangleIcon className="size-4" />
                <span>
                  {form.formState.errors.username?.message?.toString()}
                </span>
              </div>
            ) : (
              <div className="mt-2 flex items-center space-x-1 text-gray-500 text-sm dark:text-gray-400">
                <FaceSmileIcon className="size-4" />
                <span>Choose a unique username for your profile</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              className="w-full"
              disabled={disabled}
              loading={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating Profile..." : "Create Profile"}
            </Button>
          </div>
        </Form>
      </Card>

      {/* Help Text */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="text-gray-600 text-xs dark:text-gray-400">
          <p className="mb-1 font-medium">What happens next?</p>
          <ul className="space-y-1 text-xs">
            <li>• Your profile will be created on the Lens Protocol</li>
            <li>
              • You'll be able to post, follow, and interact with the community
            </li>
            <li>• Your username will be permanent and unique</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImprovedSignup;
