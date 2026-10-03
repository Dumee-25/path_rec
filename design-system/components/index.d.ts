import type * as React from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = NSBM green with on-green label, once per view. secondary = neutral outline. */
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface ThemeToggleProps {
  value?: ThemeChoice;
  onChange?: (value: ThemeChoice) => void;
  /** Accessible group label. Default "Theme". */
  label?: string;
}
export declare function ThemeToggle(props: ThemeToggleProps): React.ReactElement;

export interface HeaderProps {
  /** The official logo element (an <img>). Falls back to "NSBM Green University" in plain type. */
  logo?: React.ReactNode;
  homeHref?: string;
  /** Default "Faculty of Computing". Pass null to hide. */
  title?: React.ReactNode;
  /** Optional: Home, About This Tool. Nothing more. */
  links?: { label: string; href: string }[];
  theme?: ThemeChoice;
  onThemeChange?: (value: ThemeChoice) => void;
  /** Replaces the theme toggle slot. */
  end?: React.ReactNode;
  className?: string;
}
export declare function Header(props: HeaderProps): React.ReactElement;

export interface QuestionProgressProps { current: number; total: number; className?: string }
export declare function QuestionProgress(props: QuestionProgressProps): React.ReactElement;

export interface AnswerOptionProps {
  /** Shared radio group name for one question. */
  name: string;
  value: string;
  label?: React.ReactNode;
  children?: React.ReactNode;
  selected?: boolean;
  onSelect?: (value: string) => void;
  className?: string;
}
export declare function AnswerOption(props: AnswerOptionProps): React.ReactElement;

export interface MatchScoreProps {
  score: number;
  /** Default 100. */
  max?: number;
  /** primary = green bar (strongest match); secondary = blue bar (other matches). */
  tone?: 'primary' | 'secondary';
  size?: 'lg' | 'sm';
  /** Default "Pathway Match Score". Pass null to hide. */
  label?: React.ReactNode;
  className?: string;
}
export declare function MatchScore(props: MatchScoreProps): React.ReactElement;

export interface ResultCardProps {
  variant?: 'primary' | 'secondary';
  pathway: React.ReactNode;
  score: number;
  max?: number;
  scoreLabel?: React.ReactNode;
  /** Why it matches, in one or two plain sentences. */
  explanation?: React.ReactNode;
  headingLevel?: 'h2' | 'h3' | 'h4';
  children?: React.ReactNode;
  className?: string;
}
export declare function ResultCard(props: ResultCardProps): React.ReactElement;

export interface DegreeCardProps {
  title: React.ReactNode;
  university?: string;
  country?: string;
  headingLevel?: 'h3' | 'h4';
  children?: React.ReactNode;
  className?: string;
}
export declare function DegreeCard(props: DegreeCardProps): React.ReactElement;

export interface MediaFrameProps {
  label?: string;
  /** Shown when there is no media yet, e.g. "Camera preview appears here". */
  placeholder?: React.ReactNode;
  /** An <img>, <video> or <canvas>; fills the 4:3 frame. */
  children?: React.ReactNode;
  /** Buttons under the frame: Capture Photo, Retake Photo, Generate Visualization. */
  actions?: React.ReactNode;
  className?: string;
}
export declare function MediaFrame(props: MediaFrameProps): React.ReactElement;

export interface NoticeProps {
  tone?: 'info' | 'warning' | 'danger';
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}
export declare function Notice(props: NoticeProps): React.ReactElement;

export interface LoadingStateProps { message?: string; className?: string }
export declare function LoadingState(props: LoadingStateProps): React.ReactElement;

/** Persists the choice to localStorage("theme") and sets data-theme on <html>. Returns the choice. */
export declare function applyTheme(choice: ThemeChoice, options?: { root?: HTMLElement }): ThemeChoice;
/** The saved choice, or "system". */
export declare function readTheme(): ThemeChoice;
/** "light" or "dark" for a choice, reading prefers-color-scheme for "system". */
export declare function resolveTheme(choice: ThemeChoice): 'light' | 'dark';

declare global {
  interface Window {
    NsbmPathway: {
      Header: typeof Header; ThemeToggle: typeof ThemeToggle; Button: typeof Button;
      QuestionProgress: typeof QuestionProgress; AnswerOption: typeof AnswerOption;
      MatchScore: typeof MatchScore; ResultCard: typeof ResultCard; DegreeCard: typeof DegreeCard;
      MediaFrame: typeof MediaFrame; Notice: typeof Notice; LoadingState: typeof LoadingState;
      applyTheme: typeof applyTheme; readTheme: typeof readTheme; resolveTheme: typeof resolveTheme;
    };
  }
}
