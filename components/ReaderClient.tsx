'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import type { Article } from '@/lib/types';
import AudioPlayerBar, { type PlaybackSpeed } from './AudioPlayerBar';
import ReaderContent from './ReaderContent';
import VocabAndGrammarTabs from './VocabAndGrammarTabs';
import ArticleQuiz from './ArticleQuiz';
import { setReadingProgress, getReadingProgress } from '@/lib/storage';

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  A2: 'bg-teal-100 text-teal-700 ring-teal-200',
  B1: 'bg-sky-100 text-sky-700 ring-sky-200',
  B2: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  C1: 'bg-purple-100 text-purple-700 ring-purple-200',
};

export default function ReaderClient({ article }: { article: Article }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);

  // Map currentTime → active sentence index based on article.timestamps
  const activeSentenceIndex = useMemo(() => {
    const ts = article.timestamps;
    for (let i = 0; i < ts.length; i++) {
      if (currentTime >= ts[i].start && currentTime < ts[i].end) {
        return ts[i].sentenceIndex;
      }
    }
    return -1;
  }, [currentTime, article.timestamps]);

  // Restore progress on mount
  useEffect(() => {
    const saved = getReadingProgress(article.id);
    if (saved > 0 && audioRef.current) {
      audioRef.current.currentTime = saved;
      setCurrentTime(saved);
    }
  }, [article.id]);

  // Persist progress occasionally
  useEffect(() => {
    const id = setInterval(() => {
      if (currentTime > 0) setReadingProgress(article.id, currentTime);
    }, 5000);
    return () => clearInterval(id);
  }, [article.id, currentTime]);

  // Reflect playback rate
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }

  function seekTo(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }

  function handleSentenceClick(sentenceIndex: number) {
    const ts = article.timestamps.find((t) => t.sentenceIndex === sentenceIndex);
    if (!ts) return;
    seekTo(ts.start);
    const audio = audioRef.current;
    if (audio && audio.paused) {
      audio.play().catch(() => undefined);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF8F3] pb-32">
      <header className="mx-auto max-w-3xl px-4 pt-8 sm:pt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All articles
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
              LEVEL_COLORS[article.level] ?? 'bg-stone-100 text-stone-700'
            }`}
          >
            {article.level}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
            {article.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-stone-500">
            <Clock className="h-3.5 w-3.5" />
            {article.readingMinutes} min
          </span>
        </div>

        <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">
          {article.title}
        </h1>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.coverImage}
          alt={article.title}
          className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover ring-1 ring-stone-200"
        />
      </header>

      <main className="mx-auto mt-10 max-w-3xl px-4">
        <ReaderContent
          article={article}
          currentSentenceIndex={activeSentenceIndex}
          onSentenceClick={handleSentenceClick}
        />

        <VocabAndGrammarTabs article={article} />
        <ArticleQuiz article={article} />
      </main>

      <audio
        ref={audioRef}
        src={article.audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      <AudioPlayerBar
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        speed={speed}
        onTogglePlay={togglePlay}
        onSeek={seekTo}
        onSpeedChange={setSpeed}
      />
    </div>
  );
}
