import { Github } from "lucide-react";

const StarGithubbutton = () => {
  return (
    <button
      className="fixed top-4 right-4 z-50 flex h-10 items-center justify-center rounded-md dark:bg-gray-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 group border border-gray-700 dark:hover:bg-gray-800 hover:drop-shadow-lg drop-shadow-white"
      onClick={() => window.open("https://github.com/soydex/app-ftn", "_blank")}
    >
      <div className="flex items-center">
        <Github className="size-5 text-gray-900 dark:text-white transition-all duration-200 rounded" />
        <span className="ml-1 text-gray-900 dark:text-white lg:inline p-1">Star on GitHub</span>
      </div>
      <div className="ml-2 flex items-center gap-1 text-sm md:flex">
        <svg
          className="size-4 text-gray-500 transition-all duration-200 group-hover:text-yellow-300"
          data-slot="icon"
          aria-hidden="true"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
            fillRule="evenodd"
          />
        </svg>
        <span className="inline-block tabular-nums tracking-wider font-display font-medium text-black dark:text-white text-gray-900">
          11
        </span>
      </div>
    </button>
  );
};

export default StarGithubbutton;
