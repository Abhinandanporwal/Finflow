import { useState } from "react";
import { toast } from "sonner";

type AsyncFunction<Args extends any[], Return> = (...args: Args) => Promise<Return>;

interface UseFetchReturn<Return, Args extends any[]> {
  data: Return | undefined;
  loading: boolean;
  error: Error | null;
  fn: (...args: Args) => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<Return | undefined>>;
}

function useFetch<Return = any, Args extends any[] = any[]>(cb: AsyncFunction<Args, Return>): UseFetchReturn<Return, Args> {
  const [data, setData] = useState<Return | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fn = async (...args: Args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cb(...args);
      setData(response);
    } catch (err: any) {
      setError(err);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
}

export default useFetch;
