// Browser-native Speech-to-Text and Text-to-Speech.
// No API keys needed — uses the browser's built-in Web Speech API.

// TypeScript doesn't know about webkitSpeechRecognition by default
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

/**
 * Starts listening to the user's microphone and returns the transcript.
 * Returns null if the browser doesn't support speech recognition.
 */
export function startListening(
  onResult: (result: VoiceRecognitionResult) => void,
  onError: (error: string) => void,
  lang: string = 'en-IN'
): (() => void) | null {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onresult = (event: any) => {
    const result = event.results[event.results.length - 1];
    onResult({
      transcript: result[0].transcript,
      isFinal: result.isFinal,
    });
  };

  recognition.onerror = (event: any) => {
    onError(`Speech recognition error: ${event.error}`);
  };

  recognition.start();

  // Return a stop function so the caller can cancel listening if needed
  return () => recognition.stop();
}

/**
 * Reads text aloud using the browser's built-in speech synthesis.
 * Respects the user's voiceSpeed preference (slow/normal/fast).
 */
export function speak(
  text: string,
  options: { lang?: string; voiceSpeed?: string } = {}
): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Text-to-speech is not supported in this browser.');
    return;
  }

  // Cancel any currently playing speech before starting new one
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'en-IN';

  const speedMap: Record<string, number> = {
    slow: 0.7,
    normal: 1.0,
    fast: 1.3,
  };
  utterance.rate = speedMap[options.voiceSpeed || 'normal'] ?? 1.0;

  window.speechSynthesis.speak(utterance);
}

/** Stops any speech currently playing. */
export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}