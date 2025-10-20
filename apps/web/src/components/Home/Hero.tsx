import { STATIC_IMAGES_URL } from "@hey/data/constants";

const Hero = () => {
  return (
    <div className="relative h-64 w-full gap-y-5 rounded-none bg-black md:rounded-xl">
      <img
        alt="hero"
        className="h-full w-full rounded-none object-cover md:rounded-xl"
        src={`${STATIC_IMAGES_URL}/hero.webp`}
      />
      <div className="absolute bottom-5 left-5">
        <div className="font-extrabold text-3xl text-white">Welcome to Hey</div>
        <div className="font-extrabold text-gray-200">
          a social network built on Lens
        </div>
      </div>
    </div>
  );
};

export default Hero;
