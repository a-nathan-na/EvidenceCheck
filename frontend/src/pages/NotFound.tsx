import { useLocation } from "react-router-dom";

const NotFound = () => {
  const { pathname } = useLocation();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-24 sm:px-10">
      <div className="max-w-xl">
        <p className="tabular font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight">This page does not exist.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Nothing is served at <span className="font-mono text-foreground">{pathname}</span>.
        </p>
        <a
          href="/"
          className="mt-6 inline-block text-sm text-accent underline-offset-4 hover:underline"
        >
          Back to the analyzer
        </a>
      </div>
    </main>
  );
};

export default NotFound;
