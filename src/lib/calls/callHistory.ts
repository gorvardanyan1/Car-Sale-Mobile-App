import { formatCallDuration } from '@/lib/calls/callState';
import type { ChatMessageShape } from '@/types/chat';

export function isCallMessage(message: ChatMessageShape | null | undefined): boolean {
  return message?.type === 'call' && message.call != null;
}

/**
 * The thread row for a finished call, from the reader's side: the caller
 * reads "No answer" where the callee reads "Missed video call".
 */
export function describeCallHistory(
  message: ChatMessageShape,
  isCaller: boolean,
  t: (key: string) => string,
): { label: string; missed: boolean; video: boolean } {
  const { callType, status, durationSec } = message.call!;
  const video = callType === 'video';

  if (status === 'ended' && durationSec > 0) {
    return {
      label: `${t(video ? 'mobile.call.history_video' : 'mobile.call.history_voice')} · ${formatCallDuration(durationSec)}`,
      missed: false,
      video,
    };
  }
  if (status === 'ended') {
    return { label: t(video ? 'mobile.call.history_video' : 'mobile.call.history_voice'), missed: false, video };
  }
  if (status === 'declined') {
    return {
      label: t(isCaller ? 'mobile.call.history_declined' : 'mobile.call.history_you_declined'),
      missed: false,
      video,
    };
  }
  if (status === 'missed') {
    return isCaller
      ? { label: t('mobile.call.history_no_answer'), missed: false, video }
      : {
          label: t(video ? 'mobile.call.history_missed_video' : 'mobile.call.history_missed_voice'),
          missed: true,
          video,
        };
  }
  return { label: t('mobile.call.history_failed'), missed: false, video };
}
