import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from "react";
import { getErrorMessage } from "../api/errors";

interface UseAsyncDataOptions<T> {
  enabled?: boolean;
  initialData?: T;
  errorMessage?: string;
  onSuccess?: (data: T) => void;
}

interface UseAsyncDataResult<T> {
  data: T | undefined;
  setData: Dispatch<SetStateAction<T | undefined>>;
  isLoading: boolean;
  error: string;
  reload: () => void;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataResult<T> {
  const {
    enabled = true,
    initialData,
    errorMessage = "Something went wrong. Please try again.",
    onSuccess,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  fetcherRef.current = fetcher;
  onSuccessRef.current = onSuccess;

  const reload = useCallback(() => {
    setReloadCount((count) => count + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const result = await fetcherRef.current();
        if (cancelled) return;

        setData(result);
        onSuccessRef.current?.(result);
      } catch (err) {
        if (cancelled) return;

        setError(getErrorMessage(err, errorMessage));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [enabled, errorMessage, reloadCount, ...deps]);

  return { data, setData, isLoading, error, reload };
}
