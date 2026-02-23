import React from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { businessOwnerTourSteps, employeeTourSteps, clientTourSteps } from './tourSteps';
import { useTour } from '@/hooks/useTour';

interface WelcomeTourProps {
    userId?: string;
    userRole?: 'BUSINESS_OWNER' | 'EMPLOYEE' | 'CLIENT';
}

export const WelcomeTour: React.FC<WelcomeTourProps> = ({ userId, userRole }) => {
    const { run, stepIndex, setStepIndex, completeTour, stopTour } = useTour(userId, userRole);

    // Select steps based on user role
    const getSteps = () => {
        switch (userRole) {
            case 'BUSINESS_OWNER':
                return businessOwnerTourSteps;
            case 'EMPLOYEE':
                return employeeTourSteps;
            case 'CLIENT':
                return clientTourSteps;
            default:
                return businessOwnerTourSteps;
        }
    };

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, index } = data;

        if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
            completeTour();
        } else if (type === EVENTS.STEP_AFTER) {
            setStepIndex(index + 1);
        }
    };

    if (!userId || !userRole) return null;

    return (
        <Joyride
            steps={getSteps()}
            run={run}
            stepIndex={stepIndex}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#2563eb',
                    textColor: '#1f2937',
                    backgroundColor: '#ffffff',
                    overlayColor: 'rgba(0, 0, 0, 0.3)',
                    arrowColor: '#ffffff',
                    zIndex: 1000,
                },
                tooltip: {
                    borderRadius: 12,
                    padding: 20,
                },
                tooltipContainer: {
                    textAlign: 'left',
                },
                buttonNext: {
                    backgroundColor: '#2563eb',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                },
                buttonBack: {
                    color: '#6b7280',
                    marginRight: 10,
                },
                buttonSkip: {
                    color: '#9ca3af',
                },
            }}
            locale={{
                back: 'Atrás',
                close: 'Cerrar',
                last: 'Finalizar',
                next: 'Siguiente',
                skip: 'Saltar tour',
            }}
        />
    );
};
