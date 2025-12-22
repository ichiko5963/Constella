'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface RecordingContextType {
    isRecording: boolean;
    isImmersiveOpen: boolean;
    activeProjectId?: number;
    toggleImmersive: () => void;
    openImmersive: (projectId?: number) => void;
    closeImmersive: () => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export function RecordingProvider({ children }: { children: ReactNode }) {
    const [isRecording, setIsRecording] = useState(false); // Can be linked to actual recorder state later
    const [isImmersiveOpen, setIsImmersiveOpen] = useState(false);
    const [activeProjectId, setActiveProjectId] = useState<number | undefined>(undefined);

    const toggleImmersive = () => setIsImmersiveOpen(prev => !prev);
    const openImmersive = (projectId?: number) => {
        setActiveProjectId(projectId);
        setIsImmersiveOpen(true);
    };
    const closeImmersive = () => {
        setIsImmersiveOpen(false);
        setActiveProjectId(undefined); // Reset on close? Or keep? Reset seems safer.
    };

    return (
        <RecordingContext.Provider value={{
            isRecording,
            isImmersiveOpen,
            activeProjectId,
            toggleImmersive,
            openImmersive,
            closeImmersive
        }}>
            {children}
        </RecordingContext.Provider>
    );
}

export function useRecording() {
    const context = useContext(RecordingContext);
    if (context === undefined) {
        throw new Error('useRecording must be used within a RecordingProvider');
    }
    return context;
}
