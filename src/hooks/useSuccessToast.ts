import { useCallback, useState } from 'react';

export function useSuccessToast() {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((text: string) => {
    setMessage(text);
  }, []);

  const hide = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    visible: message !== null,
    message: message ?? '',
    show,
    hide,
  };
}
