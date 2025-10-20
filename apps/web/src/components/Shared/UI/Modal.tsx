import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode, SyntheticEvent } from "react";
import { Fragment, memo } from "react";

const modalVariants = cva(
  [
    "relative",
    "inline-block",
    "w-full",
    "overflow-hidden",
    "scale-100",
    "rounded-2xl",
    "border",
    "border-white/10",
    "bg-black/80",
    "text-left",
    "text-white",
    "backdrop-blur-md",
    "shadow-xl",
    "transition-all",
    "sm:my-8",
    "sm:align-middle"
  ].join(" "),
  {
    defaultVariants: { size: "sm" },
    variants: {
      size: {
        lg: "sm:max-w-5xl",
        md: "sm:max-w-3xl",
        sm: "sm:max-w-lg",
        xs: "sm:max-w-sm"
      }
    }
  }
);

interface ModalProps extends VariantProps<typeof modalVariants> {
  children: ReactNode | ReactNode[];
  onClose?: () => void;
  show: boolean;
  title?: ReactNode;
}

const Modal = ({ children, onClose, show, size = "sm", title }: ModalProps) => {
  const handleClose = (event: SyntheticEvent) => {
    event.stopPropagation(); // This stops the event from propagating further
    onClose?.();
  };

  return (
    <Transition as={Fragment} show={show}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 flex min-h-screen items-center justify-center overflow-y-auto p-4 text-center sm:block sm:p-0"
        onClose={() => onClose?.()}
      >
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" />
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-black/60"
          onClick={handleClose}
        />
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enterTo="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0 sm:scale-100"
          leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <DialogPanel className={modalVariants({ size })}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
            {title ? (
              <DialogTitle
                className={[
                  "flex",
                  "items-center",
                  "justify-between",
                  "border-b",
                  "border-white/10",
                  "bg-black/40",
                  "px-5",
                  "py-3.5"
                ].join(" ")}
              >
                <div className={["flex", "items-center", "gap-2"].join(" ")}>
                  <span
                    className={[
                      "relative",
                      "inline-flex",
                      "h-6",
                      "w-6",
                      "items-center",
                      "justify-center"
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute",
                        "inset-0",
                        "rounded-full",
                        "bg-fuchsia-500/30",
                        "blur-md"
                      ].join(" ")}
                    />
                    <img
                      alt="Logo"
                      className={["relative", "h-6", "w-6", "rounded"].join(
                        " "
                      )}
                      src="/logo.png"
                    />
                  </span>
                  <b className="text-white">{title}</b>
                </div>
                {onClose ? (
                  <button
                    className="rounded-full p-1 text-white/80 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    type="button"
                  >
                    <XMarkIcon className="size-5" />
                  </button>
                ) : null}
              </DialogTitle>
            ) : null}
            {children}
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
};

export default memo(Modal);
