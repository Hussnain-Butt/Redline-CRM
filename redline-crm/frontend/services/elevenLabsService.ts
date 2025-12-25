/**
 * ElevenLabs Service
 * Handles text-to-speech for voicemail drops and voice features
 */

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Check if ElevenLabs is configured
export function isElevenLabsConfigured(): boolean {
    return Boolean(
        ELEVENLABS_API_KEY &&
        ELEVENLABS_API_KEY !== 'your_elevenlabs_api_key_here'
    );
}

// ==================== VOICES ====================

export interface ElevenLabsVoice {
    voice_id: string;
    name: string;
    category: string;
    description: string;
    preview_url: string;
    labels: {
        accent?: string;
        age?: string;
        gender?: string;
        use_case?: string;
    };
}

/**
 * Fetch available voices from ElevenLabs
 */
export async function fetchVoices(): Promise<ElevenLabsVoice[]> {
    if (!isElevenLabsConfigured()) {
        throw new Error('ElevenLabs is not configured. Please add your API key to .env.local');
    }

    try {
        const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail?.message || 'Failed to fetch voices');
        }

        const data = await response.json();
        return data.voices;
    } catch (error) {
        console.error('Error fetching voices:', error);
        throw error;
    }
}

// ==================== TEXT TO SPEECH ====================

export interface TTSOptions {
    voiceId: string;
    text: string;
    stability?: number; // 0-1, default 0.5
    similarityBoost?: number; // 0-1, default 0.75
    style?: number; // 0-1, default 0
    useSpeakerBoost?: boolean;
}

/**
 * Convert text to speech using ElevenLabs
 * Returns audio as a Blob
 */
export async function textToSpeech(options: TTSOptions): Promise<Blob> {
    if (!isElevenLabsConfigured()) {
        throw new Error('ElevenLabs is not configured');
    }

    const {
        voiceId,
        text,
        stability = 0.5,
        similarityBoost = 0.75,
        style = 0,
        useSpeakerBoost = true,
    } = options;

    try {
        const response = await fetch(
            `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability,
                        similarity_boost: similarityBoost,
                        style,
                        use_speaker_boost: useSpeakerBoost,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail?.message || 'Failed to generate speech');
        }

        return await response.blob();
    } catch (error) {
        console.error('Error generating speech:', error);
        throw error;
    }
}

/**
 * Generate voicemail audio and return as playable URL
 */
export async function generateVoicemail(
    voiceId: string,
    script: string
): Promise<string> {
    const audioBlob = await textToSpeech({
        voiceId,
        text: script,
        stability: 0.6,
        similarityBoost: 0.8,
    });

    return URL.createObjectURL(audioBlob);
}

// ==================== VOICE TEMPLATES ====================

export interface VoicemailTemplate {
    id: string;
    name: string;
    script: string;
    voiceId: string;
    audioUrl?: string;
}

// Default voicemail templates
export const DEFAULT_VOICEMAIL_TEMPLATES: Omit<VoicemailTemplate, 'audioUrl'>[] = [
    {
        id: '1',
        name: 'Professional Introduction',
        script: "Hi, this is {{agentName}} from {{companyName}}. I'm calling to follow up on our previous conversation. Please give me a call back at your earliest convenience. Thank you!",
        voiceId: 'default',
    },
    {
        id: '2',
        name: 'Appointment Reminder',
        script: "Hello, this is a reminder about your upcoming appointment with {{companyName}}. Please call us back to confirm. We look forward to speaking with you!",
        voiceId: 'default',
    },
    {
        id: '3',
        name: 'Sales Follow-up',
        script: "Hi {{contactName}}, this is {{agentName}} from {{companyName}}. I wanted to touch base regarding the proposal we discussed. I'd love to answer any questions you might have. Please call me back when you have a moment.",
        voiceId: 'default',
    },
];

/**
 * Get user info for subscription limits
 */
export async function getUserInfo(): Promise<{
    character_count: number;
    character_limit: number;
    remaining_characters: number;
}> {
    if (!isElevenLabsConfigured()) {
        throw new Error('ElevenLabs is not configured');
    }

    try {
        const response = await fetch(`${ELEVENLABS_API_URL}/user/subscription`, {
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail?.message || 'Failed to fetch user info');
        }

        const data = await response.json();
        return {
            character_count: data.character_count,
            character_limit: data.character_limit,
            remaining_characters: data.character_limit - data.character_count,
        };
    } catch (error) {
        console.error('Error fetching user info:', error);
        throw error;
    }
}

// ==================== AUDIO PLAYBACK ====================

let currentAudio: HTMLAudioElement | null = null;

/**
 * Play audio from URL
 */
export function playAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Stop any currently playing audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        currentAudio = new Audio(url);
        currentAudio.onended = () => {
            currentAudio = null;
            resolve();
        };
        currentAudio.onerror = (e) => {
            currentAudio = null;
            reject(e);
        };
        currentAudio.play();
    });
}

/**
 * Stop currently playing audio
 */
export function stopAudio(): void {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
}

/**
 * Preview a voice by playing its sample
 */
export async function previewVoice(previewUrl: string): Promise<void> {
    await playAudio(previewUrl);
}
