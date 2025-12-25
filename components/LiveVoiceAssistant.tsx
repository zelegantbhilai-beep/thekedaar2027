
import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles, Calendar, CheckCircle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Worker } from '../types';

interface LiveVoiceAssistantProps {
  worker?: Worker;
  onClose: () => void;
  onBookingConfirmed: (date: string, time: string) => void;
}

export const LiveVoiceAssistant: React.FC<LiveVoiceAssistantProps> = ({ worker, onClose, onBookingConfirmed }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [transcription, setTranscription] = useState('');
  const [isInterrupted, setIsInterrupted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  useEffect(() => {
    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
            },
            systemInstruction: `You are a helpful booking assistant for Thekedaar. 
              The user wants to book ${worker?.name || 'a professional'} for ${worker?.profession || 'home services'}.
              Help them choose a date and time.
              Available times are 9am-11am, 11am-1pm, 2pm-4pm, and 4pm-6pm.
              Once they agree on a date and time, call the 'confirmBooking' function.
              Be friendly and concise. Mention the worker's name: ${worker?.name || 'the professional'}.`,
            tools: [{
              functionDeclarations: [{
                name: 'confirmBooking',
                parameters: {
                  type: 'OBJECT' as any,
                  properties: {
                    date: { type: 'STRING' as any, description: 'The date in YYYY-MM-DD format' },
                    time: { type: 'STRING' as any, description: 'The time slot chosen' }
                  },
                  required: ['date', 'time']
                }
              }]
            }]
          },
          callbacks: {
            onopen: () => {
              setIsConnecting(false);
              setIsActive(true);
              const source = audioContextRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const pcmBlob = {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current!.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                  if (fc.name === 'confirmBooking') {
                    const args = fc.args as any;
                    onBookingConfirmed(args.date, args.time);
                    sessionPromise.then(s => s.sendToolResponse({
                      functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                    }));
                  }
                }
              }

              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                const ctx = outputAudioContextRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onerror: (e) => console.error('Live API Error:', e),
            onclose: () => setIsActive(false),
          }
        });
        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Failed to initialize voice assistant", err);
        setIsConnecting(false);
      }
    };

    startSession();

    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
      if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg p-8 relative z-10 shadow-2xl border border-white/10 overflow-hidden flex flex-col items-center">
        {/* Glowing Background Effect */}
        <div className={`absolute -top-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

        <div className="w-full flex justify-between items-center mb-10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">AI Booking Agent</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Live Voice Connection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-10 relative z-10 w-full">
          {isConnecting ? (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 border-4 border-blue-100 dark:border-blue-900 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Connecting to Assistant...</p>
            </div>
          ) : (
            <>
              <div className="relative mb-12">
                <div className={`absolute inset-0 bg-blue-500/30 rounded-full blur-2xl animate-pulse ${isActive ? 'scale-150' : 'scale-0'}`} />
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-blue-600 shadow-xl shadow-blue-500/40' : 'bg-gray-200 dark:bg-gray-700'}`}>
                   {isActive ? (
                     <Mic className="w-12 h-12 text-white animate-bounce" />
                   ) : (
                     <MicOff className="w-12 h-12 text-gray-400" />
                   )}
                </div>
              </div>

              <div className="text-center space-y-4 max-w-sm">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {worker ? `Booking ${worker.name}` : "Tell me what you need"}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  "I'd like to book {worker?.name || 'the professional'} for tomorrow afternoon."
                </p>
              </div>

              {/* Visualizer bars */}
              <div className="flex gap-1.5 h-8 items-center mt-12">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 bg-blue-500 rounded-full transition-all duration-300 ${isActive ? 'animate-wave' : 'h-1'}`}
                    style={{ 
                      animationDelay: `${i * 100}ms`,
                      height: isActive ? `${Math.random() * 24 + 8}px` : '4px'
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="w-full mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-400 font-medium">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <span>Voice: Zephyr</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Secure Connection</span>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes wave {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
