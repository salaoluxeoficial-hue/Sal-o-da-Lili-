import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, AlertCircle } from 'lucide-react';
import { uploadAudioToSupabaseStorage } from '@/src/services/supabaseChatService';
import { ChatAttachment } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface AudioRecorderProps {
  onAudioRecorded: (attachment: ChatAttachment) => void;
  onCancel?: () => void;
  isCompact?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioRecorded,
  onCancel,
  isCompact = false
}) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Clean up timer and media streams on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg'
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('O seu navegador ou dispositivo não suporta gravação de áudio.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop microphone stream tracks
        stream.getTracks().forEach(track => track.stop());

        const finalMime = mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalMime });
        audioBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setRecordingState('preview');
      };

      mediaRecorder.start(200); // chunk size
      setRecordingState('recording');
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 300) { // Limit to 5 minutes
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.warn('Microphone permission or recording error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Permissão do microfone negada. Por favor, permita o acesso ao microfone nas configurações do seu navegador.');
      } else {
        setErrorMessage('Não foi possível acessar o microfone do dispositivo.');
      }
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setRecordingState('idle');
    setRecordingTime(0);
    setIsPlayingPreview(false);
    audioBlobRef.current = null;
    audioUrlRef.current = null;
    if (onCancel) onCancel();
  };

  const togglePreviewPlay = () => {
    if (!audioUrlRef.current) return;
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(audioUrlRef.current);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
      previewAudioRef.current.ontimeupdate = () => {
        setPreviewTime(previewAudioRef.current?.currentTime || 0);
      };
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setIsPlayingPreview(true);
      }).catch(err => {
        console.warn('Preview playback error:', err);
      });
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlobRef.current) return;
    setIsUploading(true);

    const blob = audioBlobRef.current;
    const durationSec = recordingTime;
    const fileName = `audio_${Date.now()}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;

    // Try uploading to Supabase Storage
    const publicUrl = await uploadAudioToSupabaseStorage(blob, fileName);

    let finalUrl = publicUrl;

    // Fallback to Base64 Data URL if storage is unavailable
    if (!finalUrl) {
      finalUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    const attachment: ChatAttachment = {
      id: `att-audio-${Date.now()}`,
      name: `Áudio (${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, '0')})`,
      url: finalUrl,
      type: 'audio',
      mimeType: blob.type || 'audio/webm',
      sizeFormatted: `${(blob.size / 1024).toFixed(0)} KB`,
      duration: durationSec
    };

    setIsUploading(false);
    setRecordingState('idle');
    setRecordingTime(0);

    onAudioRecorded(attachment);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (errorMessage) {
    return (
      <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
        <button
          type="button"
          onClick={() => setErrorMessage(null)}
          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold text-[11px]"
        >
          Fechar
        </button>
      </div>
    );
  }

  if (recordingState === 'idle') {
    return (
      <button
        type="button"
        onClick={startRecording}
        className={cn(
          "p-2 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all",
          isCompact ? "p-1.5" : "p-2"
        )}
        title="Gravar mensagem de áudio"
      >
        <Mic size={18} />
      </button>
    );
  }

  if (recordingState === 'recording') {
    return (
      <div className="flex-1 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-2 flex items-center justify-between gap-3 animate-pulse">
        <div className="flex items-center gap-2.5 px-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-bold text-rose-400">Gravando áudio...</span>
          <span className="text-xs font-mono font-extrabold text-white bg-black/40 px-2 py-0.5 rounded-md">
            {formatTime(recordingTime)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cancelRecording}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Cancelar gravação"
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-900/30"
          >
            <Square size={14} className="fill-current" />
            <span>Concluir</span>
          </button>
        </div>
      </div>
    );
  }

  // Preview State
  return (
    <div className="flex-1 bg-[#181818] border border-[#d4af37]/40 rounded-2xl p-2 flex items-center justify-between gap-3 animate-in fade-in">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          type="button"
          onClick={togglePreviewPlay}
          className="w-8 h-8 rounded-full bg-[#d4af37] text-black flex items-center justify-center shrink-0 hover:bg-[#e5c158] transition-colors"
          title={isPlayingPreview ? "Pausar" : "Ouvir gravação"}
        >
          {isPlayingPreview ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-white block truncate">
            Pré-escuta de áudio ({formatTime(recordingTime)})
          </span>
          <span className="text-[10px] text-neutral-400 block">
            Ouça antes de enviar ou descarte se preferir
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={cancelRecording}
          disabled={isUploading}
          className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-colors"
          title="Descartar gravação"
        >
          <Trash2 size={16} />
        </button>

        <button
          type="button"
          onClick={sendAudioMessage}
          disabled={isUploading}
          className="px-3 py-1.5 bg-[#d4af37] hover:bg-[#e5c158] text-black rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#d4af37]/20 disabled:opacity-50"
        >
          {isUploading ? (
            <span className="text-[11px] animate-pulse">Enviando...</span>
          ) : (
            <>
              <Send size={14} />
              <span>Enviar Áudio</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
