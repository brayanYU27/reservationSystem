import { useState, useEffect } from 'react';

interface TourState {
    hasSeenTour: boolean;
    tourCompleted: boolean;
}

export const useTour = (userId?: string, userRole?: string) => {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    const storageKey = `tour_${userId}_${userRole}`;

    useEffect(() => {
        if (!userId || !userRole) return;

        const tourState = localStorage.getItem(storageKey);
        if (!tourState) {
            // New user, show tour after a short delay
            const timer = setTimeout(() => {
                setRun(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [userId, userRole, storageKey]);

    const startTour = () => {
        setStepIndex(0);
        setRun(true);
    };

    const stopTour = () => {
        setRun(false);
    };

    const completeTour = () => {
        const tourState: TourState = {
            hasSeenTour: true,
            tourCompleted: true,
        };
        localStorage.setItem(storageKey, JSON.stringify(tourState));
        setRun(false);
    };

    const resetTour = () => {
        localStorage.removeItem(storageKey);
        setStepIndex(0);
        setRun(true);
    };

    const hasSeenTour = (): boolean => {
        const tourState = localStorage.getItem(storageKey);
        if (!tourState) return false;

        try {
            const state: TourState = JSON.parse(tourState);
            return state.hasSeenTour;
        } catch {
            return false;
        }
    };

    return {
        run,
        stepIndex,
        setStepIndex,
        startTour,
        stopTour,
        completeTour,
        resetTour,
        hasSeenTour: hasSeenTour(),
    };
};
