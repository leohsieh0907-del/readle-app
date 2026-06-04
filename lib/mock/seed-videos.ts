/**
 * 影片資料 loader
 *
 * 影片內容統一放在 `data/videos.json`，本檔只是 type-safe 載入器。
 * 要新增 / 修改影片請編輯 data/videos.json（見 data/README.md）。
 */

import videosData from '@/data/videos.json';
import type { MockVideo } from '../readle-types';

export const seedVideos: MockVideo[] = videosData as MockVideo[];

export function findVideo(id: string): MockVideo | undefined {
  return seedVideos.find((v) => v.id === id);
}
