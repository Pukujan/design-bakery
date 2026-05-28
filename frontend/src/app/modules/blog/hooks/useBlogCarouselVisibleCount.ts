import { useEffect, useState } from 'react';

/** lg = 1024px — below: 2 cards visible; lg+: 3 cards. */
const THREE_CARD_MEDIA = '(min-width: 1024px)';

export function useBlogCarouselVisibleCount(): 2 | 3 {
  const [count, setCount] = useState<2 | 3>(() =>
    typeof window !== 'undefined' && window.matchMedia(THREE_CARD_MEDIA).matches ? 3 : 2,
  );

  useEffect(() => {
    const mq = window.matchMedia(THREE_CARD_MEDIA);
    const onChange = () => setCount(mq.matches ? 3 : 2);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return count;
}
