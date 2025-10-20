import { Image } from "@/components/Shared/UI";

const FullPageLoader = () => {
  return (
    <div className="grid h-screen place-items-center">
      <Image
        alt="Logo"
        className="size-32"
        height={128}
        src="/logo.png"
        width={128}
      />
    </div>
  );
};

export default FullPageLoader;
