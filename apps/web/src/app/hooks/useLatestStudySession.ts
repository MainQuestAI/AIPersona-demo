import { useEffect, useState } from 'react';

import {
  getLatestStudySession,
  subscribeLatestStudySession,
  type LatestStudySession,
} from '../services/studySession';

export function useLatestStudySession(): LatestStudySession | null {
  const [latestStudy, setLatestStudy] = useState<LatestStudySession | null>(null);

  useEffect(() => {
    setLatestStudy(getLatestStudySession());
    return subscribeLatestStudySession(() => {
      setLatestStudy(getLatestStudySession());
    });
  }, []);

  return latestStudy;
}
